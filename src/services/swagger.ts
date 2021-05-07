import {RequestHandler} from 'express';
import {Definition, Definitions, IMethodDescription, MethodTypes} from './swagger.model';
import {UtilsService} from './utils.service';
import {get, isEmpty, last} from 'lodash';

export class SwaggerMethodObject {
  private utils = UtilsService.instance();

  constructor(private options: IMethodDescription, private method: MethodTypes, private definitions: Definitions) {}

  response: RequestHandler = (req, res) => {
    const {options, utils, definitions} = this;
    const {params: reqParams, body, query} = req;
    const {tags, parameters, responses} = this.options;

    const checkParamResult = this.utils.checkInputParameters(req, parameters, definitions);
    if (!isEmpty(checkParamResult.checkResult)) {
      res.status(500).send(checkParamResult.checkResult.join(',\n'));
      return;
    }

    if (this.method === 'post') {
      const $refItems = get(options, `responses['200'].schema.items.$ref`);
      if ($refItems) {
        const definition = get({definitions}, this.utils.convertDefinitionPath($refItems));
        if (definition) {
          const {title: cacheName, required} = definition;
          const saveKey = 'id';
          if (!required.includes('id')) {
            res.status(500).send(`Can't define uniq field for ${cacheName}`);
          }
          for (const paramName in checkParamResult.params) {
            const parameter = parameters.find((item) => item.name === paramName);
            const $ref = get(parameter, 'schema.items.$ref');
            if ($ref && last(this.utils.convertDefinitionPath($ref).split('.')) === `${cacheName}Create`) {
              res.json(this.utils.cache.get(cacheName).addList(checkParamResult.params[paramName], saveKey));
              return;
            }
          }
        }
      }
      res.status(500).send('Something went wrong');
    }
    if (this.method === 'get') {
      const $ref = get(options, `responses['200'].schema.$ref`);
      const responseType = get(options, `responses['200'].schema.type`, 'object');
      let definition: Definition | undefined;
      if ($ref) {
        definition = get({definitions}, this.utils.convertDefinitionPath($ref));
      }

      if (!definition) {
        res.status(500).send('Definition for call is not defined');
        return;
      }
      const {title: cacheName} = definition;

      const result = this.utils.cache.get(cacheName).getByParams(checkParamResult.params);
      if (responseType === 'object') {
        if (!result.length) {
          res.status(404).send(`${cacheName} not found by ${JSON.stringify(checkParamResult.params)}`);
        } else {
          res.json(result[0]);
        }
      }
    }
  };
}
