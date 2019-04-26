'use strict';

const DefaultClientOptions = {
  scheme: 'ws',
  host: 'localhost',
  port: 3000,
  path: '',
  protocols: null,
  socketOptions: null,
  autoReconnect: false,
  reconnectDelay: 5000 // 5 seconds
};

class MobSocket {
  constructor (websocketModule) {
    this.WebSocket = (typeof WebSocket === 'undefined' ? websocketModule : WebSocket);
    this.webSocketListeners = (typeof WebSocket === 'undefined' ? this.nodeWebSocketListeners : this.browserWebSocketListeners);
    this.clientWS = null;
    this.serverWS = null;
    this.clientOptions = DefaultClientOptions;
    this.serverOptions = {};
  }


  // NOTE: function only works in node, not in browser
  /*
  server: object, a pre-configured HTTP server to use for the websocket host
  options
    onMessage: function(ws, message), optional, handle incoming messages on websocket
    onConnect: function(ws), optional, handle client connection event
    onError: function(err), optional, error callback
  */
  createServerSocket (server, options) {
    this.serverOptions = Object.assign({}, options);
    this.serverWS = new this.WebSocket.Server({ server: server });
    let self = this;
    this.serverWS
      .on('connection', function (ws, req) {
        ws.on('message', function (message) {
          (self.serverOptions.onMessage ? self.serverOptions.onMessage(ws, message) : self.serverOnMessage(message));
        });
        (self.serverOptions.onConnect ? self.serverOptions.onConnect(ws) : self.serverOnConnect(ws));
      })
      .on('error', function (err) {
        (self.serverOptions.onError ? self.serverOptions.onError(err) : self.serverOnError(err));
      });
    return this.serverWS;
  }

  serverOnMessage (message) {
    console.log('MESSAGE:', message);
  }

  serverOnConnect (ws) {
    console.log('CLIENT CONNECTED');
  }

  serverOnError (err) {
    console.log('SERVER ERROR', err);
  }


  /*
  options
    host: string, required, the server hostname
    port: integer, required, the server port number
    onError: function, optional, error handler
    onOpen: function, optional, callback when socket opens
    onMessage: function, optional, socket incoming message handler
    autoReconnect: boolean, optional, set to true to automatically reconnect on socket close
    reconnectDelay: integer, optional, set milliseconds of delay before an auto reconnect creates new connection
    socketOptions: object, optional, options to pass to websocket creation, i.e. { rejectUnauthorized: false }
    scheme: string, optional, websocket scheme to use, i.e. scheme: 'wss'
    path: string, optional, HTTP path for websocket connection request
    protocols: a websocket sub-protocol string or array of strings
  */
  createClientSocket (options) {
    this.clientOptions = Object.assign({}, DefaultClientOptions, options);
    // TODO close any existing client websocket
    this.clientWS = new this.WebSocket(
      this.clientOptions.scheme + '://' + this.clientOptions.host + ':' + this.clientOptions.port + ('/' + this.clientOptions.path).replace(/\/\//, '/'),
      this.clientOptions.protocols,
      this.clientOptions.socketOptions
    );
    this.webSocketListeners(this.clientWS, this.clientOptions);
    return this.clientWS;
  }

  getClientWebSocket () {
    return this.clientWS;
  }

  closeClient (autoReconnect) {
    this.clientOptions.autoReconnect = !!autoReconnect;
    this.clientWS.close();
  }


  browserWebSocketListeners (ws, options) {
    let self = this;
    ws.onopen = function () { self.webSocketOnOpen(options, ws); };
    ws.onclose = function (evt) { self.webSocketOnClose(options, ws, evt); };
    ws.onerror = function (err) { self.webSocketOnError(options, ws, err); };
    ws.onmessage = function (msg) { self.webSocketOnMessage(options, ws, msg.data); };
  }

  nodeWebSocketListeners (ws, options) {
    let self = this;
    ws.on('open', function () { self.webSocketOnOpen(options, ws); });
    ws.on('close', function (evt) { self.webSocketOnClose(options, ws, evt); });
    ws.on('error', function (err) { self.webSocketOnError(options, ws, err); });
    ws.on('message', function (msg) { self.webSocketOnMessage(options, ws, msg); });
  }

  webSocketOnOpen (options, ws) {
    (options.onOpen ? options.onOpen(ws) : (function () { console.log('SOCKET OPEN'); })());
  }

  webSocketOnClose (options, ws, evt) {
    // TODO remove all listeners
    (options.onClose ? options.onClose(ws) : (function () { console.log('SOCKET CLOSED', evt); })());
    if (options.autoReconnect) {
      console.log('SOCKET RECONNECT');
      let self = this;
      setTimeout(function () { self.createClientSocket(options); }, options.reconnectDelay);
    }
  }

  webSocketOnError (options, ws, err) {
    (options.onError ? options.onError(ws, err) : (function () { console.log('SOCKET ERROR', err); })());
  }

  webSocketOnMessage (options, ws, msg) {
    (options.onMessage ? options.onMessage(ws, msg) : (function () { console.log('SOCKET MESSAGE', msg); })());
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = MobSocket;
}
