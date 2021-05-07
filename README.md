# simple-stub-server

The package is intended for fast deployment of API server with stubs. Allows you to quickly generate CRUD APIs and APIs that return stub data during development. The API is formed from a directory with files with specific names `get` `post` `put` `delete` and extensions `json` `json5` `js`.


# Installation
Standard installation into the project 
```
npm i simple-stub-server
```
Or can be installed globally
```
npm i -g simple-stub-server
```


# How to
To start the server, it needs to specify 1-3 parameters

- -f (folder) - Path to directory with stub metadata
- -p (port) - The default server port is 3001
- -s (save-cache) - Flag where to save cache data in the file system, by default in `<folder>/.cache`, if not set, then it is not saved

Sample script for package.json
```
"stub": "simple-stub-server -f  ./stub -s"
```

The distribution package contains an example of a `CRUD` api for the entity `person` - `node_modules/simple-stub-server/stub`

Files with the extensions `json` or `json5` simply return their content in response to the corresponding request type of request.
For example, a call to GET `http://localhost:3001/person/data` will return data from the file `<folder>/person/data/get.json`

Files with the `js` extension are scripts in which you can create processing of request parameters and form a response to them

The files are monitored and the server API is updated every time the structure of the `<folder>` directory is changed.

Each js file is a function that accepts parsed request parameters as input, and the result of this function will be passed in response to the client.


An example script that returns data from the cache service by key

```javascript
//file <folder>/person/#personid/get.js
module.exports = (data, utils) => {
  const {cache} = utils;
  const {params} = data;
  console.log(data);
  return cache.get('person').getByKey(params.personid);
};
```
Call example
```
GET http://localhost:3001/person/123
```

An example script that creates a new entry in the cache service by key
```javascript
//file <folder>/person/put.js
module.exports = (data, utils) => {
  const {cache} = utils;
  const {body} = data;
  const id = cache.get('person').add(body);
  return {status: 'ok', id};
};
```
Call example
```
PUT http://localhost:3001/person
```

An example script that removes data from the cache service by key
```javascript
//file <folder>/person/#personid/delete.js
module.exports = (data, utils) => {
  const {cache} = utils;
  const {params} = data;
  const res = cache.get('person').removeByKey(params.personid);
  return {
    status: res ? 'ok' : 'error',
    id: res,
  };
};
```
Call example
```
DELETE http://localhost:3001/person/123
```

An example of a script that receives data from the cache service and sends it in response

```javascript
//file <folder>/persons/get.js
module.exports = (data, utils) => {
  const {cache} = utils;
  return cache.get('person').all();
};
```
Call example
```
GET http://localhost:3001/persons
```

## Caching data to files

When specifying the `-s` flag when starting the server, the data saved through the caching service will be saved to the corresponding files in the file system. When stopped and restarted, the data in the cache will be restored from these files.

## Swagger

In alpha-version mode, API generation from `swagger 2.0` description files is supported. To do this, it is enough to put files with the extension `.swagger` (regular json) in the root directory` folder`, the server will automatically parse these files and form the API list.

```
Register: GET /dq-pr/v1/action/:id (Receiving a stock by ID)
Register: POST /dq-pr/v1/action/:id/products (Adding links of the action with products)
Register: DELETE/dq-pr/v1/action/:id / products
...
Register: PUT /dq-pr/v1/action/:id/publish
Register: POST /dq-pr/v1/actions (Bulk stock creation method)

```

```
Important! If similar js | json | json5 files exist for the generated swagger APIs, they will override the swagger API.
```