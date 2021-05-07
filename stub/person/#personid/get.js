module.exports = async (data, utils) => {
  const {cache} = utils;
  const {params} = data;
  console.log(data);
  return cache.get('person').getByKey(params.personid);
};
