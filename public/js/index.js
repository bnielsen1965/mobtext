
let mobSocket = new MobSocket();
let ws = mobSocket.createClientSocket({
  onOpen: function () { msg(); },
  autoReconnect: true
});

function msg () {
  mobSocket.getClientWebSocket().send('this is a test');
  setTimeout(function () { msg(); }, 1000);
}
