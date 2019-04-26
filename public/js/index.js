
let mobSocket = new MobSocket();
let ws = mobSocket.createClientSocket({
  onOpen: function () { msg(); }
});

function msg () {
  ws.send('this is a test');
  setTimeout(function () { msg(); }, 1000);
}
