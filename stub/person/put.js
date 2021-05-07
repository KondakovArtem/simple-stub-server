module.exports = (data, utils) => {
  const {cache} = utils;
  const {body} = data;
  debugger;
  const id = cache.get('person').add(body);
  return {status: id ? 'ok': 'error', id};
};
