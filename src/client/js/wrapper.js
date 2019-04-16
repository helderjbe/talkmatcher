import Peer from './Peer';
import { ui, socket } from './index';

var wrapper = (function () {
  var _peerConnections = {};
  var _localStream = null;
  var _timer = 0;
  var _enabledAllState = true;
  
  var _params = {
    sdpSemantics: 'unified-plan', // sdpSemantics change in future
    iceServers: [
      {
        "urls": [
          "turn:turn.talkmatcher.com"
        ]
      },
      {
        "urls": [
          "stun:turn.talkmatcher.com"
        ]
      }
    ]};
  
  const _streamConstraints = {
    audio: true,
    video: false
  };
  
  function _onError(msg) {
    ui.stopProcess();
    ui.changeLog(msg, 'red');
  }
  
  function _recvAnswerError(e) {
    ui.changeLog(e, 'red');
    console.error('Error setting Remote Description after answer: ' + e);
  }
  
  async function _gotPair(msg) {
    if (!_localStream || !_localStream.getAudioTracks || _localStream.getAudioTracks().length === 0) {
      _onError('No audio available');
      return;
    }

    // Update the turn server key if new connection.
    if ('key' in msg)
      Object.assign(_params.iceServers[0], msg.key);

    // Create peer connections and add behavior.
    for (let socketId in msg.sockets) {
      if (!msg.sockets.hasOwnProperty(socketId)) continue;

      await _newPeer(socketId, msg.sockets[socketId], true);
    }
  }
  
  async function _init(username, queue) {
    if (!_localStream) {
      
      if (!navigator.mediaDevices.getUserMedia) {
        _onError.bind(this, 'Please update your browser');
        return;
      }
      
      try {
        _localStream = await navigator.mediaDevices.getUserMedia(_streamConstraints);

        socket.emit('pair', username, queue);
      } catch(e) {
        _onError('Cannot find audio input. Accepted permissions?');
      }
    } else {
      _kill('peerConnections');
      _kill('leave');
      socket.emit('pair', username, queue);
    }
  }
  
  function _muteAll() {
    _enabledAllState = !_enabledAllState;
    
    for (let socketId in _peerConnections) {
      if (!_peerConnections.hasOwnProperty(socketId)) continue;

      _peerConnections[socketId].muteAudioWatch();
    }
  }
  
  function _kill(type = 'leave') {
    switch (type) {
      case 'localStream':
        if (_localStream) {
          if (_localStream.getAudioTracks) {
            _localStream.getAudioTracks().forEach(function(track) {track.stop();});
          } else {
            _localStream.stop();
          }
          _localStream = null;
        }
        break;
      case 'peerConnections':
        if (Object.keys(_peerConnections).length && _peerConnections.constructor === Object) {
          for (let socketId in _peerConnections) {
            if (!_peerConnections.hasOwnProperty(socketId)) continue;
            
            _deletePeer(socketId);
          }

          _peerConnections = {};
        }
        break;
      case 'leave':
        socket.emit('leave');
    }
  }
  
  function _stop() {
    if (_localStream) {
      _kill('localStream');
    }
    if (_peerConnections) {
      _kill('peerConnections');
    }
    _kill('leave');
  }
  
  async function _addCandidate(msg, socketId) {
    if (!_peerConnections[socketId]) return;
    
    try {
      await _peerConnections[socketId].connection.addIceCandidate(new RTCIceCandidate({
        sdpMLineIndex: msg.label,
        candidate: msg.candidate
      }));
    } catch (e) {
      _onError(e);
    }
  }
  
  async function _recvSdp(msg, socketId) {
    if (!_peerConnections[socketId]) return;
    
    await _peerConnections[socketId].setRemoteSdp(msg);
    
    if (msg.type === 'offer')
      _peerConnections[socketId].doAnswer();
  }
  
  async function _newPeer(socketId, username, shouldOffer) {
    _peerConnections[socketId] = new Peer(socketId, _params, username, shouldOffer);
    await _peerConnections[socketId].build();
  }
  
  function _deletePeer(socketId) {
    if (!_peerConnections[socketId]) return;
    
    _peerConnections[socketId].disconnect(socketId);
    delete _peerConnections[socketId];
  }
  
  return {
    get peerConnections() {return _peerConnections;},
    get localStream() {return _localStream;},
    get timer() {return _timer;},
    get enabledAllState() {return _enabledAllState;},
    
    get params() {return _params;},
    
    get streamConstraints() {return _streamConstraints;},
    
    onError: _onError,
    recvAnswerError: _recvAnswerError,
    
    gotPair: _gotPair,
    init: _init,
    muteAll: _muteAll,
    kill: _kill,
    stop: _stop,
    
    addCandidate: _addCandidate,
    recvSdp: _recvSdp,
    newPeer: _newPeer,
    deletePeer: _deletePeer
  };
  
})();

export default wrapper;