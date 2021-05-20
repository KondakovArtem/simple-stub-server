import {Server} from 'http';
import https from 'https';
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
const stubTypes = <const>['json5', 'js', 'json', 'swagger'];
type TStubTypes = typeof stubTypes[number];
export class StubService {
  private app?: ReturnType<typeof express>;
  private appJson?: ReturnType<typeof express>;
  private server?: Server;

  private serverSocketService = ServerSocketService.instance();
  private fileService = FileService.instance();
  private utils = UtilsService.instance();

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

  private updateRoutesDebounce = debounce(async () => {
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
      const apiPath = `/${normalize(dirname(apiUrl)).replace(/\\/gi, '/').replace(/##/gi, '*').replace(/#/gi, ':')}`;

      if (dataType === 'swagger') {
        await this.registerSwaggerApi({apiUrl, item, itemData, type, dataType, apiPath});
      } else {
        const cb: RequestHandler = async (req, res) => {
          let error;
          // console.log(req.body);
          try {
            if (['json', 'json5'].includes(dataType)) {
              return res.json(json5.parse(await fs.readFile(item, 'utf-8')));
            } else if (dataType === 'js') {
              delete require.cache[require.resolve(item)];
              const {params, body, query, cookies} = req;
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const fn = require(item);
              let cbResult = fn({params, body, query, cookies}, UtilsService.instance(), res);
              if (cbResult instanceof Promise) {
                cbResult = await cbResult;
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

  public registerApiMethod(type: string, apiPath: string, cb: RequestHandler, description?: string) {
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
    ];

    console.log(`searching in`, this.globPatterns);

    if (app) {
      this.appJson = app.use(cookieParser()).use(
        express.json({
          limit: '50mb',
        }),
      );
      this.appJson.options('*', cors() as any);
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
