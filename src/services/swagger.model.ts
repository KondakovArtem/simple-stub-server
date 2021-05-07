export interface IMethodDescription {
  tags: string[];
  summary: string;
  operationId: string;
  consumes: string[];
  produces: string[];
  parameters: IMethodParameters[];
  responses: {
    [code: string]: IMethodResponse;
  };
}

export enum Description {
  Ok = 'OK',
}

export interface IMethodResponse {
  description: Description;
  schema: {
    type: 'array';
    items: {
      $ref: string;
    };
  };
}

export enum PropTypes {
  Array = 'array',
  Boolean = 'boolean',
  String = 'string',
}

export enum RequiredIn {
  Body = 'body',
  Path = 'path',
  Query = 'query',
}

export interface ItemsClass {
  $ref: string;
}

export interface PurpleSchema {
  type: PropTypes;
  items: ItemsClass;
}

export interface IMethodParameters {
  name: string;
  in: RequiredIn;
  description: string;
  required: boolean;
  type?: PropTypes;
  format?: string;
  items?: TagsItems;
  schema?: PurpleSchema;
}

export interface TagsItems {
  type: EndDateType;
  format: string;
}

export enum EndDateType {
  Boolean = 'boolean',
  Integer = 'integer',
  String = 'string',
  Object = 'object',
  Array = 'array',
}

export enum MethodTypes {
  get = 'get',
  put = 'put',
  delete = 'delete',
  post = 'post',
}

export interface ISwaggerConfig {
  swagger: string;
  info: {
    description: string;
    version: string;
    title: string;
  };
  paths: {
    [path: string]: {
      [key in MethodTypes]: IMethodDescription;
    };
  };
  definitions: Definitions;
}

export type Definitions = {
  [name: string]: Definition;
};

export enum AttributesType {
  Object = 'object',
}

export enum Format {
  Date = 'date',
  DateTime = 'date-time',
  Empty = '',
  Int32 = 'int32',
}

export interface IProperty {
  type: EndDateType;
  format: Format;
  description: string;
}

export interface Definition {
  type: AttributesType;
  properties: {
    [name: string]: IProperty;
  };
  required?: string[];
  title: string;
}
