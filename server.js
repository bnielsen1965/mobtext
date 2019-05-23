'use strict';

const Path = require('path');
const Express = require('express');
const FavIcon = require('serve-favicon');
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');
const HTTP = require('http');
const WS = require('ws');
const UUIDv4 = require('uuid/v4');
const MobSocket = require('./lib/mobsocket');

const Defaults = {
  port: 3000
};

let app = Express();
app.use(FavIcon(Path.join(__dirname, 'public', 'favicon.ico')));
app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());
app.use(CookieParser());
app.use(Express.static(Path.join(__dirname, 'public')));

let buffer = "";

let server = HTTP.createServer(app);
let mobSocket = new MobSocket(WS);
let ws = mobSocket.createServerSocket(server, {
  uuidMethod: UUIDv4,
  onMessage: function (uuid, message) {
    console.log('M', message)
    let msg;
    try {
      msg = JSON.parse(message);
    }
    catch (e) {
      console.log('JSON ERROR', e.message);
      return;
    }
    processMessage(uuid, msg);
  }
});
server.listen(Defaults.port, (Defaults.address || null), function () {
  console.log('Server up on port ' + Defaults.port);
});


function processMessage(uuid, message) {
  switch (message.action) {
    case 'getbuffer':
    mobSocket.sendToClient(uuid, JSON.stringify({ action: 'getbuffer', buffer: buffer }));
    break;

    case 'keydown':
    let currentHashCode = hashCode(buffer);
    let char = charFromKeyDown(message);
    switch (char.charCodeAt(0)) {
      case 8:
      buffer = buffer.slice(0, message.position - 1) + buffer.slice(message.position);
      break;

      case 13:
      buffer = buffer.slice(0, message.position) + '\n' + buffer.slice(message.position);
      break;

      case 46:
      buffer = buffer.slice(0, message.position) + buffer.slice(message.position + 1);
      break;

      default:
      buffer = buffer.slice(0, message.position) + char + buffer.slice(message.position);
    }

    let response = { action: 'insertkey', char: char, position: message.position };
    let targeted = {};
    if (currentHashCode !== message.hashCode) {
      console.log('HC', currentHashCode, message.hashCode)
      console.log(buffer)
      targeted[uuid] = JSON.stringify(Object.assign({}, response, { buffer: buffer }));
    }

    mobSocket.sendToClients(JSON.stringify(response), targeted);
    break;
  }
}


function charFromKeyDown(message) {
  if (message.key && message.key.length === 1) {
    return message.key;
  }
  return String.fromCharCode(parseInt(message.keyCode));
}

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}
