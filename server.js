'use strict';

const Path = require('path');
const Express = require('express');
const FavIcon = require('serve-favicon');
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');
const HTTP = require('http');
const WS = require('ws');
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

let server = HTTP.createServer(app);
let mobSocket = new MobSocket(WS);
let ws = mobSocket.createServerSocket(server, {
  onMessage: function (ws, msg) {
    ws.send('ECHO: ' + msg)
  }
});
server.listen(Defaults.port, (Defaults.address || null), function () {
  console.log('Server up on port ' + Defaults.port);
});
