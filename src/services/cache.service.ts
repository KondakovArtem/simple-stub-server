import {chunk} from 'lodash';
import {UniqPrefixGenerator} from './uniq';
import {debounce} from 'lodash';
import fs from 'fs-extra';
import {resolve} from 'path';


export const stringify = (obj: any, indent = 2): string =>
    JSON.stringify(
        obj,
        (key, value) => {
            if (Array.isArray(value) && !value.some((x) => x && typeof x === 'object')) {
                return `\uE000${JSON.stringify(
                    value.map((v) => (typeof v === 'string' ? v.replace(/"/g, '\uE001') : v)),
                )}\uE000`;
            }
            return value;
        },
        indent,
    ).replace(/"\uE000([^\uE000]+)\uE000"/g, (match) =>
        match
            .substr(2, match.length - 4)
            .replace(/\\"/g, '"')
            .replace(/\uE001/g, '\\"'),
    );

class CacheInstance {
  items: any[] = [];

  private uniq = new UniqPrefixGenerator();

  private getCachePath() {
    return resolve(this.cachePath as string, `${this.prefix}.json`);
  }
  private getCacheHelperPath() {
    return resolve(this.cachePath as string, `${this.prefix}_helper.json`);
  }

  constructor(private prefix: string, private cachePath?: string) {
    if (cachePath) {
      try {
        if (fs.existsSync(this.getCachePath())) {
          this.items = fs.readJSONSync(this.getCachePath());
        }
        if (fs.existsSync(this.getCacheHelperPath())) {
          this.uniq.setMap(fs.readJSONSync(this.getCacheHelperPath()));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  private updateCacheDebounce = debounce(async () => {
    const {cachePath} = this;
    await fs.mkdirs(cachePath as string);
    Promise.all([
      await fs.writeJSON(resolve(cachePath as string, this.getCachePath()), this.items, {
        spaces: 1,
      }),
      await fs.writeJSON(resolve(cachePath as string, this.getCacheHelperPath()), this.uniq.getMap(), {
        spaces: 1,
      }),
    ]);
  }, 500);

  add(item: any, key = 'id') {
    item[key] = this.uniq.get(this.prefix);
    this.items.push(item);
    this.cachePath && this.updateCacheDebounce();
    return item[key];
  }
  all() {
    return this.items;
  }
  addList(items: any[], key = 'id') {
    return items.map((item) => {
      return {
        ...item,
        [key]: this.add(item, key),
      };
    });
  }

  updateByKey(value: any, key = 'id') {
    const res: any[] = [];
    this.items = this.items.map((item) => {
      if (item[key] + '' === value[key] + '') {
        const newObj = {
          ...item,
          ...value,
        };
        res.push(newObj);
        return newObj;
      }
      return item;
    });
    this.cachePath && this.updateCacheDebounce();
    return res;
  }

  clear() {
    this.items = [];
  }

  removeByKey(value: any, key = 'id') {
    let res;
    this.items = this.items.filter((item) => {
      if (item[key] + '' !== value + '') {
        return true;
      }
      res = item;
      return false;
    });
    this.cachePath && this.updateCacheDebounce();
    return res;
  }
  getByKey(value: any, key = 'id') {
    return this.items.find((item) => item[key] + '' === value + '');
  }
  getChunk(rowsCount: number, index: number) {
    return chunk(this.items, rowsCount)[index];
  }
  getByParams(params: {[key: string]: any}) {
    return this.items.filter((item) => {
      for (const param in params) {
        if (params[param] + '' != item[param] + '') {
          return false;
        }
        return true;
      }
    });
  }
}

export class CacheService {
  private static _instance: CacheService;
  private cachePath?: string;
  private instances: {
    [key: string]: CacheInstance;
  } = {};

  constructor() {
    if (!CacheService._instance) {
      CacheService._instance = this;
    }
    return CacheService._instance;
  }

  public setCachePath(cachePath?: string) {
    this.cachePath = cachePath;
  }

  get(key: string) {
    if (!this.instances[key]) {
      this.instances[key] = new CacheInstance(key, this.cachePath);
    }
    return this.instances[key];
  }
}
