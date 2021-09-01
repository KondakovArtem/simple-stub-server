const PROXY_CONFIG = [
  {
    context: ['/my', '/many', '/endpoints', '/i', '/need', '/to', '/proxy'],
    target: 'http://google.com',
    secure: false,
  },
];

module.exports = PROXY_CONFIG;
