import 'normalize.css';
import '../css/main.css';

import io from 'socket.io-client';

import wrapper from './wrapper';

const pair = [...document.querySelectorAll('#pair button')];
const stopButton = document.getElementById('stop');
const loader = document.getElementById('loader');
const logDiv = document.getElementById('log');
const username = document.getElementById('username');
const muteAll = document.getElementById('muteAll');
const muteFx = document.getElementById('muteFx');

const enter = new Audio('assets/sounds/enter.mp3');
const leave = new Audio('assets/sounds/leave.mp3');

const MAX_USR_LEN = 16;
const MIN_USR_LEN = 2;
const USR_MATCH = /^[\w\.\-\s]*$/;
const WAIT_PAIR = 5000;
const DEFAULT_USERNAME = 'Anonymous';
const START_MSG = logDiv.textContent;
var START_BUTTONS = [];
pair.forEach((button) => {
  START_BUTTONS.push(button.innerHTML);
});
const NEXT_MSG = 'NEXT';

var global = {
  queue: -1,
  count: 0,
  disabled: false
};

// Send errors to server
window.onerror = function(message, source, lineno, colno) {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://talkmatcher.com/api/logger', true); // It has to be hardcoded for the app
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({
    message: message,
    source: source,
    lineno: lineno,
    colno: colno
  }));
  return true;
};

// Helper function
var support = {
  supportsWebRTC: ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].some((item) => {
    return item in window;
  })
};

// localStorage
var storage = (function() {
  var _useAux = false;
  var _aux = {};
  
  const _isSupported = function() {
    try {
      const testKey = "__test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };

  const _setItem = function(token, value) {
    if (_useAux) {
      _aux[token] = value;
    } else {
      window.localStorage.setItem(token, value);
    }
  };

  const _getItem = function(token) {
    if (_useAux) {
      if (token in _aux) {
        return _aux[token];
      } else {
        return null;
      }
    } else {
      return window.localStorage.getItem(token);
    }
  };
  
  const _setAux = function() {
    _useAux = true;
  };
  
  return {
    get useAux() {return _useAux;},
    get aux() {return _aux;},

    isSupported: _isSupported,
    setItem: _setItem,
    getItem: _getItem,
    setAux: _setAux
  };
})();

// Timer settings
var timerTools = (function() {
  var _timer = null;
  var _started = false;

  const _waitingTime = function() {
    return (new Date().getTime() - _timer);
  };

  const _timerFunc = function() {
    if (_waitingTime() <= WAIT_PAIR) {
      if (_started && !logDiv.textContent.startsWith('Wait')) { // If another element used the logDiv, do not update anymore
        _started = false;
        return;
      }
      ui.changeLog('Wait ' + Math.round((WAIT_PAIR - _waitingTime())/1000) + ' seconds to pair again', 'red');
      _started = true;
      return window.setTimeout(_timerFunc.bind(this), 1000); // continue the loop
    } else {
      _started = false;
      ui.changeLog(START_MSG, 'blue');
    }
  };

  const _start = function() {
    if (!_started) {
      _timer = storage.getItem('timer');
      if (_timer && _waitingTime() <= WAIT_PAIR) {
        _timerFunc();
        return false;
      }
      return true;
    }
  };
  
  return {
    get timer() {return _timer;},
    get started() {return _started;},

    waitingTime: _waitingTime,
    timerFunc: _timerFunc,
    start: _start
  };
})();

// UI logic
var ui = (function() {
  const _changeLog = function(msg, color = '') {
    logDiv.textContent = msg;
    logDiv.className = color;
  };
  
  const _updateLoader = function() {
    if (global.queue != -1 && global.count <= global.queue) {
      _display(loader, true);
      let candidates = global.queue - global.count + 1;
      if (candidates > 1) {
        _changeLog('Looking for ' + candidates + ' users', 'yellow');
      } else {
        _changeLog('Looking for ' + candidates + ' user', 'yellow');
      }
    } else {
      _display(loader, false);
      _changeLog(START_MSG, 'blue');
    }
  };

  const _setUsernameFromStorage = function() {
    let user = storage.getItem('name');
    if (user) _setUsername(user);
  };

  const _playSound = function(sound) {
    sound.play();
  };

  const _setButtonHTML = function(index, html) {
    pair[index].innerHTML = html;
  }

  const _stopProcess = function() {
    wrapper.stop();
  
    _disableUsername(false);
    _display(stopButton, false);
    pair[global.queue].innerHTML = START_BUTTONS[global.queue]; // RESET button html NEXT_MSG to initial state START_BUTTONS
  
    global.queue = -1;
    _updateLoader();
  };

  const _muteAllProcess = function() {
    wrapper.muteAll();
  
    if (wrapper.enabledAllState) {
      muteAll.src = "assets/icons/microphone-all.svg";
      _changeLog('Unmuted Mic');
    } else {
      muteAll.src = "assets/icons/microphone-all-slash.svg";
      _changeLog('Muted Mic');
    }
  };

  const _muteFxProcess = function() {
    if (enter.muted && leave.muted) {
      enter.muted = false;
      leave.muted = false;
      muteFx.src = "assets/icons/note.svg";
      _changeLog('Unmuted notification sounds');
    } else {
      enter.muted = true;
      leave.muted = true;
      muteFx.src = "assets/icons/note-slash.svg";
      _changeLog('Muted notification sounds');
    }
  };

  const _display = function(element, doShow) {
    if (doShow) {
      element.className = '';
    } else {
      element.className = 'hide';
    }
  }

  const _disableUsername = function(doDisable) {
    if (doDisable) {
      username.disabled = true;
    } else {
      username.disabled = false
    }
  }

  const _getUsername = function() {
    return username.value;
  }

  const _setUsername = function(str) {
    username.value = str;
  }
  
  return {
    changeLog: _changeLog,
    updateLoader: _updateLoader,
    setUsernameFromStorage: _setUsernameFromStorage,
    playSound: _playSound,
    stopProcess: _stopProcess,
    muteAllProcess: _muteAllProcess,
    muteFxProcess: _muteFxProcess,
    display: _display,
    disableUsername: _disableUsername,
    getUsername: _getUsername,
    setUsername: _setUsername
  };
})();

// Socket logic

const socket = io.connect('https://talkmatcher.com/');
socket.on('msg', async(msg, socketId) => {
  switch (msg.type) {
    case 'candidate':
      await wrapper.addCandidate(msg, socketId);
      break;
    case 'offer':
    case 'answer':
      await wrapper.recvSdp(msg, socketId);
      break;
    case 'pair':
      global.count = Object.keys(msg.sockets).length;
      ui.updateLoader();

      storage.setItem('timer', new Date().getTime());
      
      await wrapper.gotPair(msg);
      
      ui.display(stopButton, true);
      break;
    case 'join':
      global.count++;
      ui.updateLoader();

      await wrapper.newPeer(socketId, msg.username, false);
      
      ui.playSound(enter);
      break;
    case 'leave':
      global.count--;
      ui.updateLoader();

      wrapper.deletePeer(socketId);
      
      ui.playSound(leave);
      break;
    default:
      if (typeof msg === 'string')
        ui.changeLog(msg, 'red');
  }
});

socket.on('connect_error', () => {
  ui.changeLog('Connection to server lost', 'red');
  global.disabled = true;

  if(global.queue >= 0 && !global.count) // If user is searching and found no one, stop the process
    ui.stopProcess();
});

socket.on('reconnect', () => {
  ui.changeLog('Reconnected', 'blue');
  global.disabled = false;
});

///////////////////////////////////////////

// use alternative if localStorage not available
if (!storage.isSupported()) { 
  storage.setAux();
}

// Get username if stored
if (!ui.getUsername()) {
  ui.setUsernameFromStorage();
}

// Button logic
if (!support.supportsWebRTC)
  ui.changeLog('WebRTC not supported, please use the app or another browser', 'red');
else {
  pair.forEach((button) => {
    button.addEventListener('click', async(event) => {
      if (global.disabled) {
        return;
      }
      
      if (!USR_MATCH.test(ui.getUsername())) {
        ui.changeLog('Special characters not allowed', 'red');
        return;
      }

      if (!ui.getUsername().length) { // Fast start = if user does not write username, just give him/her the Anonymous name
        ui.setUsername(DEFAULT_USERNAME);
      } else if (ui.getUsername().length < MIN_USR_LEN || ui.getUsername().length > MAX_USR_LEN) {
        ui.changeLog('Name should be ' + MIN_USR_LEN + ' to ' + MAX_USR_LEN + ' letters long', 'red');
        return;
      }

      if (!timerTools.start()) return;
      
      global.queue = parseInt(event.target.className.match(/\d+/)[0]);
      ui.updateLoader();

      if (ui.getUsername() !== DEFAULT_USERNAME) {
        storage.setItem('name', ui.getUsername());
      }

      ui.disableUsername(true);

      // Update button message
      pair.forEach((otherButton, index) => {
        if (button.className != otherButton.className && otherButton.innerHTML === NEXT_MSG) { // Check if other buttons have the NEXT_MSG message
          otherButton.innerHTML = START_BUTTONS[index];
        }
      });
      button.innerHTML = NEXT_MSG;

      await wrapper.init(ui.getUsername(), global.queue);
    });
  });
}

// Event listeners

stopButton.addEventListener('click', ui.stopProcess);

muteAll.addEventListener('click', ui.muteAllProcess);

muteFx.addEventListener('click', ui.muteFxProcess);

///////////////////////////////////////////

export {
  global,
  ui,
  socket,
  support,
  storage
};