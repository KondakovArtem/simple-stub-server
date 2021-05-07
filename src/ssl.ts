//@ts-ignore
import node_openssl from 'node-openssl-cert';

const options = {
  binpath: 'C:/Program Files/OpenSSL-Win64/bin/openssl.exe',
};

const openssl = new node_openssl(options);

// openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt

openssl.generateRSAPrivateKey({}, function (err: any, key: string, cmd: string) {
  console.log(cmd);
  console.log(key);
});
