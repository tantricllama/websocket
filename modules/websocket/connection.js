var events = require('events').EventEmitter,
  util = require('util'),
  parser = require('./parser.js'),
  frame = require('./frame.js');

// The module needs to allow for event listeners, so we need to extend the EventEmitter.
function connection(socket) {
  events.call(this);

  socket.on('data', this.dataHandler.bind(this));
  socket.on('close', this.closeHandler.bind(this));
  socket.on('error', this.errorHandler.bind(this));

  this.socket = socket;

  this.parser = new parser();
  this.parser.on('frame', this.frameHandler.bind(this));

  this.frame = new frame();
}
util.inherits(connection, events);

// Add the data to the connection's parser.
connection.prototype.dataHandler = function(data) {
  this.parser.addData(data);
}

// Close event handler.
// This should emit an event to the websocket object so it can be removed from the list of connections.
connection.prototype.closeHandler = function(had_error) {
  console.log('Socket closed' + (had_error ? ' due to transmission error' : ''));
  // TODO: Handle close
}

// Error event handler.
// This should log the errors.
connection.prototype.errorHandler = function(error) {
  console.log('error', error);
  // TODO: Handle error
}

// Handler for parsed frames.
// Text and binary frames will be emitted once a frame with a 'fin' bit is read.
// Continuation, close, ping, and pong frames are handled internally.
connection.prototype.frameHandler = function(frame) {
  switch (frame.opcode) {
    case 0: // continuation
    case 1: // text
    case 2: // binary
      this.frame.merge(frame);
      if (this.frame.fin) {
        this.emit('frame', this.frame);
        this.frame.reset();
      }
      break;
    case 8: // close
      this.closeHandler(false);
      break;
    case 9: // ping
      this.pingHandler();
      break;
    case 10: // pong
      this.pongHandler();
      break;
    default:
      // TODO: this should close the connection
  }
}

// Ping frame handler.
connection.prototype.pingHandler = function() {
  // TODO: Handle ping
}

// Pong frame handler.
connection.prototype.pongHandler = function() {
  // TODO: Handle pong
}

module.exports = connection;