module.exports = (data, utils) => {
  const {cache} = utils;
  const {params} = data;
  const res = cache.get('person').removeByKey(params.personid);
  return {
    status: res ? 'ok' : 'error',
  };
};
