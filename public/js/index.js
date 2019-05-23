
let mobSocket = new MobSocket();
let ws = mobSocket.createClientSocket({
  onOpen: function () {
    ws.send(JSON.stringify({ action: 'getbuffer' }));
  },
  onMessage: function (ws, message) {
    try {
      let msg = JSON.parse(message);
      processMessage(msg);
    }
    catch (e) {
      console.log('JSON ERROR', e.message, '-'+message)
    }
  },
  autoReconnect: true
});

function msg () {
  mobSocket.getClientWebSocket().send('this is a test');
  setTimeout(function () { msg(); }, 1000);
}

function processMessage(message) {
  switch (message.action) {
    case 'getbuffer':
    console.log('GOTBUFFER', message.buffer)
    $('#mobtext').text(message.buffer).removeProp('disabled');
    break;

    case 'insertkey':
    if (message.buffer) {
      resetBuffer('mobtext', message.buffer);
      break;
    }
    switch (message.char.charCodeAt(0)) {
      case 8:
      deleteAtPosition('mobtext', message.position);
      break;

      case 46:
      deleteAtPosition('mobtext', message.position + 1);
      break;

      default:
      insertAtPosition('mobtext', message.char, message.position);
    }
    break;
  }
}

let printable = [13, 9, 8, 46]
$(document).ready(function () {
  $('#look').on('click', function (e) {
    let v = $('#mobtext').val();
  });


  $('#mobtext').on('keydown', function (e) {
    if (isCharacterKeyPress(e)) {
      let p = getCursorPosition('mobtext');
      e.preventDefault();
      mobSocket.getClientWebSocket().send(JSON.stringify({ action: 'keydown', key: e.key, keyCode: e.keyCode, position: getCursorPosition('mobtext'), hashCode: bufferHashCode('mobtext') }));
    }
  });
});

function isCharacterKeyPress(evt) {
  return (evt.key && (evt.key.length === 1 || -1 !== printable.indexOf(evt.keyCode)) && !evt.ctrlKey && !evt.metaKey && !evt.altKey ? true : false);
}


function resetBuffer(areaId, buffer) {
  var txtarea = document.getElementById(areaId);
  var caretPos = txtarea.selectionStart;
  txtarea.value = buffer;
  if (document.activeElement === txtarea) {
    txtarea.selectionStart = caretPos;
    txtarea.selectionEnd = caretPos;
  }
}

function deleteAtPosition(areaId, position) {
  var txtarea = document.getElementById(areaId);
  var caretPos = txtarea.selectionStart;
  caretPos +=  (position <= caretPos ? -1 : 0);
  var front = (txtarea.value).substring(0, position - 1);
  var back = (txtarea.value).substring(position, txtarea.value.length);
  txtarea.value = front + back;
  if (document.activeElement === txtarea) {
    txtarea.selectionStart = caretPos;
    txtarea.selectionEnd = caretPos;
  }
}


function insertAtPosition(areaId, text, position) {
  var txtarea = document.getElementById(areaId);
  var caretPos = txtarea.selectionStart;
  caretPos +=  (position <= caretPos ? text.length : 0);
  var front = (txtarea.value).substring(0, position);
  var back = (txtarea.value).substring(position, txtarea.value.length);
  txtarea.value = front + text + back;
  if (document.activeElement === txtarea) {
    txtarea.selectionStart = caretPos;
    txtarea.selectionEnd = caretPos;
  }
}


function getCursorPosition (areaId) {
  var txtarea = document.getElementById(areaId);
  var pos = 0;
  if ('selectionStart' in txtarea) {
      pos = txtarea.selectionStart;
  } else if ('selection' in document) {
      txtarea.focus();
      var Sel = document.selection.createRange();
      var SelLength = document.selection.createRange().text.length;
      Sel.moveStart('character', -el.value.length);
      pos = Sel.text.length - SelLength;
  }
  return pos;
}

function bufferHashCode(areaId) {
  var txtarea = document.getElementById(areaId);
  return hashCode(txtarea.value);
}

function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}
