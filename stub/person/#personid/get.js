module.exports = async (req, utils, res) => {
  res;
  //res.cookies.
  const {cache} = utils;
  const {params} = req;
  console.log(req);
  return cache.get('person').getByKey(params.personid);
};
