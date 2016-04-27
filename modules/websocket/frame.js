var events = require('events').EventEmitter,
  util = require('util');

// The module needs to allow for event listeners, so we need to extend the EventEmitter.
function frame() {
  events.call(this);
  this.reset();
}
util.inherits(frame, events);

// Merges frame data into the existing frame data.
frame.prototype.merge = function(frame) {
  this.fin = frame.fin;

  // The 'continuation' opcode should not overwrite the 'text' or 'binary' opcode.
  if (frame.opcode !== 0) {
    this.opcode = frame.opcode;
  }

  this.masked = frame.masked;
  this.mask = frame.mask;

  // Concatenate the data buffers.
  this.data = Buffer.concat([this.data, frame.data]);
  this.length += frame.length;
}

// Resets all the object properties.
frame.prototype.reset = function() {
  this.fin = undefined;
  this.opcode = undefined;
  this.masked = undefined;
  this.length = undefined;
  this.mask = undefined;
  this.data = new Buffer(0);
}

module.exports = frame;