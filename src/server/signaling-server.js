const sizeof = require('sizeof');
const uniqid = require('uniqid');

const auth = require('./auth');

module.exports = function(io, logger) {
  
  const MAX_USR_LEN = 16;
  const MIN_USR_LEN = 2;
  const USR_MATCH = /^[\w\.\-\s]*$/;
  
  const WAIT_PAIR = 5000; // 5 s

  var rooms = { // Max size of room (queue)
    0: { // Current size of room
      1: {},
      2: {}
    },
    1: {
      1: {},
      2: {},
      3: {}
    }
  };

  io.on('connection', (socket) => {
    const isObjEmpty = (obj) => {
      if (!obj) return true;
      
      for(let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }

      return JSON.stringify(obj) === JSON.stringify({});
    };

    const shiftRoom = (obj) => {
      if (!obj) return;
      
      let roomId = null;
      for(let prop in obj) {
        if(obj.hasOwnProperty(prop)) {
          roomId = prop;
          break;
        }
      }
      delete obj[roomId];

      return roomId;
    };

    const msg = (event, id = null) => {
      if (id)
        socket.to(id).emit('msg', event, socket.id);
      else
        socket.emit('msg', event);
    };

    const leaveServerRoom = () => {
      // If user didn't join any room, don't do anything
      if (!('pairedRoom' in socket) || !socket.pairedRoom) {
        return null;
      }
      
      let numSockets = socket.adapter.rooms[socket.pairedRoom] ? socket.adapter.rooms[socket.pairedRoom].length : -1;

      // Remove room from matrix
      if (numSockets === -1) {
        for (let size in rooms[socket.queue]) {
          if (!rooms[socket.queue].hasOwnProperty(size)) continue;

          if (socket.pairedRoom in rooms[socket.queue][size]) {
            numSockets = size;
            delete rooms[socket.queue][numSockets][socket.pairedRoom];
            break;
          }
        }
      } else {
        if (socket.pairedRoom in rooms[socket.queue][numSockets]) {
          delete rooms[socket.queue][numSockets][socket.pairedRoom];
        } else {
          logger.error('Error deleting room: room rooms[' + socket.queue + '][' + numSockets + '][' + socket.pairedRoom + '] does not exist');
          logger.error(socket.adapter.rooms[socket.pairedRoom]);
          numSockets = -1;
        }
      }

      if (numSockets > 1) {
        // Add room to size below
        rooms[socket.queue][numSockets-1][socket.pairedRoom] = socket.pairedRoom;

        // Tell other sockets in room to close peer connection with this client
        msg({type: 'leave'}, socket.pairedRoom);
      }

      socket.leave(socket.pairedRoom);

      socket.pairedRoom = null;
      socket.started = false;
    };

    // Message composition:
    // (event) Client -> server: msg, (socket to send - none means to broadcast)
    // (msg) Server -> client: msg, (socket that sent the message, unless self)
    socket.on('event', (event, id) => {
      if (event) {
        msg(event, id);
      }
    });
    
    /*socket.on('error', function(msg) {
      logger.warn(msg);
    });*/

    socket.on('pair', (username = 'Anonymous', queue = 0) => {
      // Checks //

      // Avoid users from spamming the pairing system
      let now = new Date().getTime();
      if ('timer' in socket && typeof socket.timer === 'number' && (now - socket.timer) < WAIT_PAIR) {
        msg('Wait ' + ((WAIT_PAIR - (now - socket.timer))/1000).toFixed(1) + ' seconds to pair again');
        return;
      }
      // Escape the parameters passed
      if (typeof queue !== 'number' || typeof username !== 'string') {
        msg('Invalid parameters');
        return;
      }
      // Avoid users using invalid queue numbers
      if (queue < 0 || queue >= Object.keys(rooms).length) {
        msg('Invalid queuing number');
        return;
      }
      // Escape the username string
      if (username.length < MIN_USR_LEN || username.length > MAX_USR_LEN || !USR_MATCH.test(username)) {
        msg('Invalid username');
        return;
      }
      // Avoid users pairing more than once
      if ('pairedRoom' in socket && socket.pairedRoom) {
        msg('User already paired');
        return;
      }

      //////////////// DON'T DO RETURNS WITHOUT leaveServerRoom() HERE ////////////////////////

      socket.queue = queue;

      let next;
      if ('started' in socket && socket.started) {
        next = true;
      } else {
        socket.started = true;
        next = false;
      }

      // Search to see if the queue isn't empty and which one
      let maxUsableRoomSize = -1;
      for (let size = socket.queue + 1; size >= 1; size--) { // Don't search in full rooms
        if (!isObjEmpty(rooms[socket.queue][size])) {
          maxUsableRoomSize = size;
          break;
        }
      }

      let data = next ? {} : {key: auth()};
      if (maxUsableRoomSize === -1) {
        // Room id to join
        socket.pairedRoom = uniqid();

        // Add room to matrix (1 is because there's only one person in room)
        rooms[socket.queue][1][socket.pairedRoom] = socket.pairedRoom;

        // Creating room so no other sockets are present
        data.sockets = {};
      } else {
        // Join existing room
        socket.pairedRoom = shiftRoom(rooms[socket.queue][maxUsableRoomSize]);
        
        // Test if room is present
        if (!socket.adapter.rooms[socket.pairedRoom]) {
          msg('Unexpected error occured, please try again');
          return leaveServerRoom();
        }

        // Add to the next matrix row
        rooms[socket.queue][maxUsableRoomSize+1][socket.pairedRoom] = socket.pairedRoom;
        
        // Send socket ids of room joined - object must be copied entirely
        // data.sockets = Object.assign({}, socket.adapter.rooms[socket.pairedRoom].sockets);
        data.sockets = socket.adapter.rooms[socket.pairedRoom].sockets;
      }
      data.type = 'pair';
      
      socket.timer = new Date().getTime();
      
      socket.join(socket.pairedRoom, () => {
        if (!socket.adapter.rooms[socket.pairedRoom]) {
          msg('Unexpected error occured, please try again');
          return leaveServerRoom();
        }
        socket.adapter.rooms[socket.pairedRoom].sockets[socket.id] = username;
        
        msg({type:'join', username:username}, socket.pairedRoom); // Broadcast to room that user joined
        msg(data);
      });
    });
    
    socket.on('leave', leaveServerRoom);
    socket.on('disconnecting', leaveServerRoom);

  });
};
