import {Server} from 'http';
// import https from 'https';
import {relative, parse, normalize, dirname, resolve} from 'path';
import fs from 'fs-extra';
import express, {RequestHandler} from 'express';
import cors from 'cors';
import glob from 'glob';
import {promisify} from 'util';
import json5 from 'json5';
import chokidar, {FSWatcher} from 'chokidar';
import {debounce, forEachRight, flatten} from 'lodash';
import cookieParser from 'cookie-parser';
import httpProxyMiddleware, {createProxyMiddleware} from 'http-proxy-middleware';

import {CacheService} from './cache.service';
import {UtilsService} from './utils.service';
import {ISwaggerConfig, MethodTypes} from './swagger.model';
import {SwaggerMethodObject} from './swagger';
import {ServerSocketService} from './server.socket.service';
import {FileService} from './file.service';

const globPromise = promisify(glob);

interface IStubServiceProps {
  port: number;
  folder: string;
  saveCache: string | boolean;
}

const types = <const>['get', 'post', 'put', 'delete'];
type TTypes = typeof types[number];
const stubTypes = <const>['json5', 'js', 'json', 'swagger', 'static'];
type TStubTypes = typeof stubTypes[number];
export class StubService {
  private app?: ReturnType<typeof express>;
  private appJson?: ReturnType<typeof express>;
  private server?: Server;

  private serverSocketService = ServerSocketService.instance();
  private fileService = FileService.instance();
  private utils = UtilsService.instance();

  private registeredURIs: {type: string; apiPath: string}[] = [];

  private globPatterns: string[] = [];
  private watchers?: FSWatcher[];
  private cacheService = new CacheService();
  constructor(private props: IStubServiceProps) {
    const {saveCache} = props;
    let cachePath;
    if (saveCache) {
      if (saveCache === true) {
        cachePath = resolve(props.folder, '.cache');
      } else {
        cachePath = resolve(saveCache);
      }
    }
    this.cacheService.setCachePath(cachePath);
  }

  private registerWatchers() {
    this.watchers?.forEach((watcher) => watcher.close());
    this.watchers = [];
    this.globPatterns.forEach((pattern) => {
      this.watchers?.push(
        chokidar
          .watch(pattern)
          .on('add', () => {
            //console.log('File', path, 'has been added');
            this.updateRoutesDebounce();
          })
          .on('unlink', () => {
            //console.log('File', path, 'has been removed');
            this.updateRoutesDebounce();
          }),
      );
    });
  }

  private async registerSwaggerApi(opts: any) {
    const config: ISwaggerConfig = await fs.readJson(opts.item);
    const {definitions, paths} = config;
    for (const path in paths) {
      const pathData = paths[path];
      for (const method in pathData) {
        const methodData = pathData[method as MethodTypes];
        const {summary} = methodData;
        const url = path.replace(/{(.+)}/gi, ':$1');

        const swaggerObj = new SwaggerMethodObject(methodData, method as MethodTypes, definitions);
        this.registerApiMethod(method, url, (...args) => swaggerObj.response(...args), summary);
      }
    }
  }

  private async registerStatic(opts: any) {
    // console.log(opts);
    const {item, apiPath} = opts;
    const itemFolder = dirname(item);
    let staticData;
    try {
      staticData = json5.parse(await fs.readFile(item, 'utf8'));
    } catch (e: any) {
      console.error(e.toString());
    }
    if (staticData) {
      const staticPath = resolve(resolve(itemFolder, staticData.folder));
      this.app?.use(apiPath, express.static(staticPath));
      console.log(`Register STATIC: in URI ${apiPath} folder - ${staticPath}`);
      // ${type.toUpperCase()} ${apiPath} ${description ? `(${description})` : ''}`);
    }

    // this.appJson?.post(apiPath, (...args) => cb(...args));
  }

  private updateRoutesDebounce = debounce(async () => {
    this.registeredURIs = [];
    // this.registerWatcher(globPattern, updateRoutesDebounce);
    const {props} = this;
    const {folder} = props;

    console.log('Refreshing routes...');
    function removeMiddlewares(route: any, i: number, routes: any) {
      if (route.name === 'bound dispatch') {
        routes.splice(i, 1);
      }
      if (route.route) route.route.stack.forEach(removeMiddlewares);
    }
    forEachRight(this.appJson?._router.stack, removeMiddlewares);

    const stubList = flatten(
      await Promise.all(
        this.globPatterns.map(async (globPattern) => {
          return await globPromise(globPattern, {nodir: true});
        }),
      ),
    );

    console.log(stubList);

    for (const item of stubList) {
      const apiUrl = relative(folder, item);
      const itemData = parse(apiUrl);
      const type = itemData.name.toLowerCase() as TTypes;
      const dataType = itemData.ext.replace(/\./gi, '').toLowerCase() as TStubTypes;

      const apiDirName = dirname(apiUrl) === '.' ? '' : normalize(dirname(apiUrl));
      const apiPath = `/${apiDirName.replace(/\\/gi, '/').replace(/##/gi, '*').replace(/#/gi, ':')}`;

      if (dataType === 'swagger') {
        await this.registerSwaggerApi({apiUrl, item, itemData, type, dataType, apiPath});
      } else if (dataType === 'static') {
        await this.registerStatic({apiUrl, item, itemData, type, dataType, apiPath});
      } else {
        const cb: RequestHandler = async (req, res) => {
          let error;
          // console.log(req.body);
          try {
            if (['json', 'json5'].includes(dataType)) {
              return res.json(json5.parse(await fs.readFile(item, 'utf-8')));
            } else if (dataType === 'js') {
              delete require.cache[require.resolve(item)];

              // const {params, body, query, cookies, headers} = req;
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const fn = require(item);
              const utils = UtilsService.instance();
              // let cbResult = fn(pick(req, ['params', 'body', 'query', 'headers']), utils, res);
              let cbResult = fn(req, utils, res);
              if (cbResult instanceof Promise) {
                cbResult = await cbResult;
              }
              if (cbResult === utils.DOWNLOAD_FILE || cbResult === utils.CUSTOM_RESPONSE) {
                return;
              }
              return !res.writableEnded && res.json(cbResult);
            }
          } catch (e) {
            error = e;
          }
          res.status(500).send(error + '');
        };
        this.registerApiMethod(type, apiPath, cb);
      }
    }
  }, 500);

  private searchInRegisteredURIs(callType: string, callApiPath: string): boolean {
    return !!this.registeredURIs.find(({apiPath, type}) => {
      return apiPath === callApiPath && type.toUpperCase() === callType;
    });
  }

  public registerApiMethod(type: string, apiPath: string, cb: RequestHandler, description?: string) {
    this.registeredURIs.push({type, apiPath});
    const {props} = this;
    const {port} = props;

    if (type === 'post') {
      console.log(
        `Register: ${type.toUpperCase()} http://localhost:${port}${apiPath} ${description ? `(${description})` : ''}`,
      );
      this.appJson?.post(apiPath, (...args) => cb(...args));
    } else if (type === 'put') {
      console.log(
        `Register: ${type.toUpperCase()} http://localhost:${port}${apiPath} ${description ? `(${description})` : ''}`,
      );
      this.appJson?.put(apiPath, cb);
    } else if (type === 'get') {
      console.log(
        `Register: ${type.toUpperCase()} http://localhost:${port}${apiPath} ${description ? `(${description})` : ''}`,
      );
      this.appJson?.get(apiPath, cb);
    } else if (type === 'delete') {
      console.log(
        `Register: ${type.toUpperCase()} http://localhost:${port}${apiPath} ${description ? `(${description})` : ''}`,
      );
      this.appJson?.delete(apiPath, cb);
    } else {
      console.error(`Wrong api type = ${type} for http://localhost:${port}${apiPath}`);
    }
  }

  // private registerProxy(absFolder: string) {
  //   const proxyConf = resolve(absFolder, 'proxy.conf.js');
  //   if (fs.existsSync(proxyConf)) {
  //     // eslint-disable-next-line @typescript-eslint/no-var-requires
  //     const config = require(proxyConf);
  //     this.app?.use('/', createProxyMiddleware(config));
  //     debugger;
  //   }
  // }
  /**
   * Assume a proxy configuration specified as:
   * proxy: {
   *   'context': { options }
   * }
   * OR
   * proxy: {
   *   'context': 'target'
   * }
   */
  setupProxyFeature(absFolder: string) {
    const proxyConfPath = resolve(absFolder, 'proxy.conf.js');
    if (fs.existsSync(proxyConfPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let proxy = require(proxyConfPath);

      if (!Array.isArray(proxy)) {
        if (Object.prototype.hasOwnProperty.call(proxy, 'target')) {
          proxy = [proxy];
        } else {
          proxy = Object.keys(proxy).map((context) => {
            let proxyOptions;
            // For backwards compatibility reasons.
            const correctedContext = context.replace(/^\*$/, '**').replace(/\/\*$/, '');

            if (typeof proxy[context] === 'string') {
              proxyOptions = {
                context: correctedContext,
                target: proxy[context],
              };
            } else {
              proxyOptions = Object.assign({}, proxy[context]);
              proxyOptions.context = correctedContext;
            }

            proxyOptions.logLevel = proxyOptions.logLevel || 'warn';

            return proxyOptions;
          });
        }
      }

      const getProxyMiddleware = (proxyConfig: any) => {
        const context = proxyConfig.context || proxyConfig.path;

        // It is possible to use the `bypass` method without a `target`.
        // However, the proxy middleware has no use in this case, and will fail to instantiate.
        if (proxyConfig.target) {
          return createProxyMiddleware(context, proxyConfig);
        }
      };
      /**
       * Assume a proxy configuration specified as:
       * proxy: [
       *   {
       *     context: ...,
       *     ...options...
       *   },
       *   // or:
       *   function() {
       *     return {
       *       context: ...,
       *       ...options...
       *     };
       *   }
       * ]
       */
      proxy.forEach((proxyConfigOrCallback: () => void | any) => {
        let proxyMiddleware: httpProxyMiddleware.RequestHandler | undefined;

        let proxyConfig = typeof proxyConfigOrCallback === 'function' ? proxyConfigOrCallback() : proxyConfigOrCallback;

        proxyMiddleware = getProxyMiddleware(proxyConfig);
        const {app} = this;
        if (app) {
          const handle = ((req, res, next) => {
            if (typeof proxyConfigOrCallback === 'function') {
              const newProxyConfig = proxyConfigOrCallback();

              if (newProxyConfig !== proxyConfig) {
                proxyConfig = newProxyConfig;
                proxyMiddleware = getProxyMiddleware(proxyConfig);
              }
            }

            // - Check if we have a bypass function defined
            // - In case the bypass function is defined we'll retrieve the
            // bypassUrl from it otherwise bypassUrl would be null
            const isByPassFuncDefined = typeof proxyConfig.bypass === 'function';
            const bypassUrl = isByPassFuncDefined ? proxyConfig.bypass(req, res, proxyConfig) : null;

            if (typeof bypassUrl === 'boolean') {
              // skip the proxy
              (req as any).url = null;
              next();
            } else if (typeof bypassUrl === 'string') {
              // byPass to that url
              req.url = bypassUrl;
              next();
            } else if (this.searchInRegisteredURIs(req.method, req.url)) {
              next();
            } else if (proxyMiddleware) {
              return proxyMiddleware(req, res, next);
            } else {
              next();
            }
          }) as Parameters<typeof app.use>[1];

          app.use(handle);
          // Also forward error requests to the proxy so it can handle them.
          app.use((error: any, req: any, res: any, next: any) => handle(req, res, next));
        }
      });
    }
  }

  public async init() {
    const {props} = this;
    const {port, folder} = props;

    this.app = express();
    this.server = new Server(this.app);
    const absFolder = resolve(folder);

    await this.serverSocketService.init(this.server);
    this.fileService.init(absFolder);
    this.utils.setFolder(absFolder);

    this.globPatterns = [
      `${absFolder}/**/@(${types.join('|')}).@(${stubTypes.join('|')})`,
      `${absFolder}/**/*.swagger`,
      `${absFolder}/**/*.static`,
    ];

    console.log(`searching in`, this.globPatterns);

    if (this.app) {
      this.appJson = this.app
        // .use((req, res, next) => {
        //   req.setEncoding('utf8');
        //   (req as any).rawBody = '';
        //   req.on('data', (chunk) => ((req as any).rawBody += chunk));
        //   req.on('end', () => next());
        // })
        .use(cookieParser())
        .use(express.json({limit: '50mb'}));

      this.appJson?.options('*', cors() as any);

      this.setupProxyFeature(absFolder);
      this.registerWatchers();

      return new Promise((resolve) => {
        this.server?.listen(port, () => {
          console.log(`Stub Server listening on port ${port}`);
          resolve(true);
        });
      });
    }
  }
}
