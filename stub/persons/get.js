module.exports = (data, utils) => {
  const {cache} = utils;
  return cache.get('person').all();
};
