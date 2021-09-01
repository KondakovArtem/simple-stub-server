const path = require('path');
const file = path.resolve(__dirname, './sample.pdf');

module.exports = (req, utils, res) => {
  res.download(file);
  return utils.DOWNLOAD_FILE;
};
