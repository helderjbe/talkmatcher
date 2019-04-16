import hark from 'hark';
import wrapper from './wrapper';
import { ui, socket, global } from './index';

var Peer = function(socketId, params, username, shouldOffer) {
  this.socketId = socketId;
  this.params = params;
  this.username = username;
  this.shouldOffer = shouldOffer;
  
  this.bitrate = 16;

  this.connection = null;
  this.voiceDetection = null;
  this.stream = null;

  this.enabledState = true;

  this.div = {};
};

Peer.prototype.OFFER_OPTIONS = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false
};

Peer.prototype.sendEvent = function(event, id) {
  socket.emit('event', event, id);
};

Peer.prototype.setElements = function(div) {
  this.div = {
    div: div,
    audio: div.getElementsByTagName('audio')[0],
    user: div.getElementsByClassName('user')[0],
    mute: div.getElementsByClassName('mute')[0],
    range: div.querySelector('input[type=range]'),
    volume: div.getElementsByClassName('volume')[0],
    speaker: div.getElementsByClassName('speaker')[0]
  }
};

Peer.prototype.gotRemoteStream = function(event) {
  let elements = document.getElementById('elements');
  let template = document.getElementById('userElement');
  let div = document.createElement('div');
  div.insertAdjacentHTML('afterbegin', template.innerHTML);
  elements.appendChild(div);

  this.setElements(div);

  // Properties

  this.div.audio.srcObject = event.streams[0];
  this.div.user.textContent = this.username;
  
  // Event Listeners

  this.div.mute.addEventListener('click', function() {
    this.enabledState = !this.enabledState;
    this.muteAudioWatch();
    this.div.mute.src = this.enabledState ? "assets/icons/microphone.svg" : "assets/icons/microphone-slash.svg";
    
    if (!wrapper.enabledAllState)
      return;
    
    if (this.username) {
      if (this.enabledState)
        ui.changeLog('Unmuted ' + this.username);
      else
        ui.changeLog('Muted ' + this.username);
    }
  }.bind(this));

  this.div.volume.addEventListener('change', function(event) {
    this.div.audio.volume = event.target.value;
    
    if (this.div.audio.volume > 0) {
      this.div.speaker.src = "assets/icons/volume-up.svg";
    } else {
      this.div.speaker.src = "assets/icons/volume-off.svg";
    }
  }.bind(this));

  this.div.speaker.addEventListener('click', function() {
    if (this.div.audio.volume > 0) {
      this.div.audio.volume = 0;
      this.div.volume.value = 0;
      this.div.speaker.src = "assets/icons/volume-off.svg";
    } else {
      this.div.audio.volume = 1;
      this.div.volume.value = 1;
      this.div.speaker.src = "assets/icons/volume-up.svg";
    }
  }.bind(this));

  this.voiceDetection = hark(event.streams[0], {});
  this.voiceDetection.resume();
  this.voiceDetection.on('volume_change', function(vol) {
    let threshold = -60;
    let max = -35;
    
    let tick = (-max * -(1/vol) * this.div.audio.volume);
    
    if (tick >= 2) {
      this.div.range.style.boxShadow = '0 0 2em #3097D1';
    } else if (vol >= threshold) {
      this.div.range.style.boxShadow = '0 0 ' + tick + 'em #3097D1';
    } else {
      this.div.range.style.boxShadow = 'none';
    }
  }.bind(this));
  
  this.muteAudioWatch();
};

Peer.prototype.stopStream = function() {
  if (this.stream) {
    if (this.stream.getAudioTracks) {
      this.stream.getAudioTracks().forEach(function(track) {track.stop();});
    } else {
      this.stream.stop();
    }
    this.stream = null;
  }
};

Peer.prototype.muteAudioWatch = function() {
  let track = null;
  if (this.stream) {
    track = this.stream.getAudioTracks()[0];
    if (track) {
      track.enabled = wrapper.enabledAllState & this.enabledState;
    } else if ('enabled' in this.stream) {
      this.stream.enabled = wrapper.enabledAllState & this.enabledState;
    }
  }
};

Peer.prototype.disconnect = function() {
  if (this.connection) {
    this.connection.close();
    this.connection = null;
  }
  if (this.voiceDetection) {
    this.voiceDetection.stop();
    this.voiceDetection = null;
  }
  this.stopStream();

  if (this.div.div) {
    this.div.div.parentNode.removeChild(this.div.div); // Remove div
  }
};

Peer.prototype.handleConnection = function(event) {
  if (event.candidate) {
    this.sendEvent({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      candidate: event.candidate.candidate
    }, this.socketId);
  }
};

Peer.prototype.doOffer = async function() {
  if (!this.connection) return;
  
  try {
    let offer = await this.connection.createOffer(this.OFFER_OPTIONS);
    await this.setLocalSdp(offer);
  } catch(e) {
    this.onError(e, 'createOffer');
  }
};

Peer.prototype.setLocalSdp = async function(sessionDesc) {
  if (!this.connection) return;
  
  sessionDesc.sdp = this.setAudioBandwidth(sessionDesc.sdp);
  
  try {
    await this.connection.setLocalDescription(sessionDesc);
  } catch(e) {
    this.onError(e, 'setLocalDescription');
  }
  
  this.sendEvent({
    sdp: sessionDesc.sdp,
    type: sessionDesc.type
  }, this.socketId);
};

Peer.prototype.setRemoteSdp = async function(sessionDesc) {
  if (!this.connection) return;
  
  sessionDesc.sdp = this.setAudioBandwidth(sessionDesc.sdp);
  
  try {
    await this.connection.setRemoteDescription(new RTCSessionDescription(sessionDesc));
  } catch(e) {
    this.onError(e, 'setRemoteDescription');
  }
};

Peer.prototype.onError = function(e, type) {
  if (global.queue <= 0) { //if using user pairing (vs group), stop the process
    ui.stopProcess();
  } else {
    this.disconnect();
  }
  
  console.error('ERROR ON "' + type + '": ', e);

  if (this.username) {
    ui.changeLog('Error connecting to ' + this.username, 'red');
  } else {
    ui.changeLog('Error connecting to peer');
  }
};

Peer.prototype.doAnswer = async function() {
  if (!this.connection) return;
  
  try {
    let answer = await this.connection.createAnswer();
    this.setLocalSdp(answer);
  } catch(e) {
    this.onError(e, 'createAnswer');
  }
};

Peer.prototype.build = async function() {
  this.connection = new RTCPeerConnection(this.params);

  this.connection.addEventListener('icecandidate', this.handleConnection.bind(this));
  this.connection.addEventListener('track', this.gotRemoteStream.bind(this));
  
  this.stream = wrapper.localStream.clone();
  
  this.stream.getAudioTracks().forEach(track => this.connection.addTrack(track, this.stream));

  if (this.shouldOffer) {
    await this.doOffer();
    this.shouldOffer = false;
  }
};

// Add a b=AS:bitrate line to the m=audio section.
Peer.prototype.setAudioBandwidth = function(sdp) {
  var sdpLines = sdp.split('\r\n');

  // Find m line for audio media.
  var mLineIndex = this.findLine(sdpLines, 'm=audio');
  if (mLineIndex === null) {
    return sdp;
  }

  // Find next m-line if any.
  var nextMLineIndex = this.findLineInRange(sdpLines, mLineIndex + 1, -1, 'm=');
  if (nextMLineIndex === null) {
    nextMLineIndex = sdpLines.length;
  }

  // Find c-line corresponding to the m-line.
  var cLineIndex = this.findLineInRange(sdpLines, mLineIndex + 1,
      nextMLineIndex, 'c=');
  if (cLineIndex === null) {
    return sdp;
  }

  // Check if bandwidth line already exists between c-line and next m-line.
  var bLineIndex = this.findLineInRange(sdpLines, cLineIndex + 1,
      nextMLineIndex, 'b=AS');
  if (bLineIndex) {
    sdpLines.splice(bLineIndex, 1);
  }

  // Create the b (bandwidth) sdp line.
  var bwLine = 'b=AS:' + this.bitrate;
  // As per RFC 4566, the b line should follow after c-line.
  sdpLines.splice(cLineIndex + 1, 0, bwLine);
  sdp = sdpLines.join('\r\n');
  return sdp;
};

// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).
Peer.prototype.findLine = function(sdpLines, prefix, substr) {
  return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
};

// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).
Peer.prototype.findLineInRange = function(
  sdpLines,
  startLine,
  endLine,
  prefix,
  substr,
  direction
) {
  if (direction === undefined) {
    direction = 'asc';
  }

  direction = direction || 'asc';

  if (direction === 'asc') {
    // Search beginning to end
    var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
    for (var i = startLine; i < realEndLine; ++i) {
      if (sdpLines[i].indexOf(prefix) === 0) {
        if (!substr ||
            sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return i;
        }
      }
    }
  } else {
    // Search end to beginning
    var realStartLine = startLine !== -1 ? startLine : sdpLines.length-1;
    for (var j = realStartLine; j >= 0; --j) {
      if (sdpLines[j].indexOf(prefix) === 0) {
        if (!substr ||
            sdpLines[j].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
          return j;
        }
      }
    }
  }
  return null;
};

export default Peer;