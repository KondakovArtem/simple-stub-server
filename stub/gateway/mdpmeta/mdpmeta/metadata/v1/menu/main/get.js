const {resolve} = require('path');

module.exports = async (req, utils) => {
    return await utils.convertDataFromMenu([{
        path: resolve(__dirname, 'mainmenu.xml'),
        project: 'dqlpsaccapp'
    }]);
}