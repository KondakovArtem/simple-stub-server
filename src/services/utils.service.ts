import {RequestHandler} from 'express';
import {get, isBoolean, isEmpty, isNumber, isObject, isString} from 'lodash';
import {CacheService} from './cache.service';
import {Definition, Definitions, IMethodParameters, RequiredIn, IProperty} from './swagger.model';
import {convertDataFromMenu} from './utils/menu-xml';
import Upload from 'upload-file';

export class UtilsService {
  public cache = new CacheService();
  private static _instance: UtilsService;
  private folder?: string;

  public DOWNLOAD_FILE = Symbol('downloadFile');
  public CUSTOM_RESPONSE = Symbol('customResponse');

  public Upload = Upload;

  public static instance() {
    return new UtilsService();
  }
  constructor() {
    if (!UtilsService._instance) {
      UtilsService._instance = this;
    }
    return UtilsService._instance;
  }

  public convertDefinitionPath(path: string) {
    return path.replace(/#\//gi, '').split('/').join('.');
  }

  public checkPropertyType(property: IProperty, value: any) {
    const {type} = property;
    if (type === 'string' && !isString(value)) {
      return false;
    }
    if (type === 'boolean' && !isBoolean(value)) {
      return false;
    }
    if (type === 'integer' && !isNumber(value)) {
      return false;
    }
    if (type === 'object' && !isObject(value)) {
      return false;
    }
    return true;
  }

  public setFolder(folder: string) {
    this.folder = folder;
  }

  public async delay(count: number) {
    return new Promise((resolve) => setTimeout(resolve, count));
  }

  public checkInputParameters(
    req: Parameters<RequestHandler>[0],
    parameters: IMethodParameters[],
    definitions: Definitions = {},
  ) {
    const {params: reqParams, body} = req;
    const res: {params: {[index: string]: any}; checkResult: string[]} = {
      params: {},
      checkResult: [],
    };

    for (const param of parameters) {
      let paramValue;
      const type = get(param, 'schema.type');
      const $ref = get(param, 'schema.items.$ref');

      let itemsDefinition: Definition | undefined;
      if ($ref) {
        itemsDefinition = get({definitions}, this.convertDefinitionPath($ref));
      }

      if (param.in === RequiredIn.Path) {
        paramValue = reqParams[param.name];
      } else if (param.in === RequiredIn.Body) {
        paramValue = body[param.name];
      }
      if (isEmpty(paramValue) && param.required) {
        res.checkResult.push(`Missing required parameter ${param.name}`);
      } else if (type === 'array') {
        if (!Array.isArray(paramValue)) {
          res.checkResult.push(`Wrong type of argument ${param.name} ${typeof paramValue} must be ${type}`);
          continue;
        }
        if (itemsDefinition) {
          const {properties, required = []} = itemsDefinition;

          paramValue = paramValue.map((paramItem, idx) => {
            const item: any = {};
            for (const property in properties) {
              const propertyValue = paramItem[property];
              if (isEmpty(paramItem[property]) && required.includes(property)) {
                res.checkResult.push(`Missing required property in ${param.name}[${idx}].${property}`);
                continue;
              }
              if (propertyValue) {
                const checkPropertyError = this.checkPropertyType(properties[property], paramItem[property]);
                if (!checkPropertyError) {
                  res.checkResult.push(
                    `Wrong type of property ${param.name}[${idx}].${property} must be ${properties[property].type}`,
                  );
                }
                item[property] = paramItem[property];
              }
            }
            return item;
          });
        }
      }

      res.params[param.name] = paramValue;
    }
    return res;
  }
  public async convertDataFromMenu(
    paths: {
      path: string;
      project: string;
    }[],
  ) {
    return convertDataFromMenu(paths, this.folder);
  }
}
