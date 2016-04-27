var events = require('events').EventEmitter,
  util = require('util'),
  frame = require('./frame.js');

// The module needs to allow for event listeners, so we need to extend the EventEmitter.
function parser() {
  events.call(this);

  this.buffer = new Buffer(0);
  this.frame = new frame();
  this.state = 0; // empty
}
util.inherits(parser, events);

// Append the data to the buffer and parse it.
parser.prototype.addData = function(data) {
  this.buffer = Buffer.concat([this.buffer, data]);
  this.parse();
}

// Parse the existing buffer.
parser.prototype.parse = function() {
  this.readHeaders();
  this.readMask();
  this.readData();
  this.emitFrame();
}

// Reads the fin, opcode, and length headers.
parser.prototype.readHeaders = function() {
  if (this.state !== 0) return; // empty

  this.state = 1; // reading headers

  // For the 'fin' bit we need to look at the last bit of the first byte.
  // If the bit is 0 then this frame is the first in a sequence, if 1 then
  // this is the only frame.
  // To check this we look for 128 / 1000 0000
  this.frame.fin = Boolean(this.buffer[0] & 128);

  // For the 'opcode' bits we look at the first 4 bits of the first byte.
  this.frame.opcode = (this.buffer[0] & 15);

  // For the 'mask' bit we need to look at the last bit of the second byte.
  // If the bit is 0 then this frame is not masked, if 1 then this is the
  // only frame.
  // To check this we look for 128 / 1000 0000
  // NOTE: The server MUST close the connection upon receiving a frame that
  // is not masked. http://tools.ietf.org/html/rfc6455#section-5.1
  this.frame.masked = Boolean(this.buffer[1] & 128);

  // The 'length' bits we need to look at the first 7 bits of the second byte.
  // To do that we shift the value to the right 1 bit.
  this.frame.length = (this.buffer[1] - 128);
  if (this.frame.length === 127) {
    this.frame.length = this.buffer.readUIntBE(2, 8);
    this.headerLength = 10;
  } else if (this.frame.length === 126) {
    this.frame.length = this.buffer.readUIntBE(2, 2);
    this.headerLength = 4;
  } else {
    this.headerLength = 2;
  }

  this.state = 2; // headers read
}

// Read the mask headers.
parser.prototype.readMask = function() {
  if (this.state !== 2) return; // headers read

  this.state = 3; // reading mask
  this.frame.mask = this.buffer.slice(this.headerLength, this.headerLength + 4);
  this.state = 4; // mask read
}

// Read the data.
parser.prototype.readData = function() {
  if (this.state !== 4 && this.state !== 7) return; // mask read && incomplete message

  this.state = 5; // reading message

  var start = this.headerLength + (this.frame.masked ? 4 : 0),
    end = (start + this.frame.length),
    i;

  if (this.buffer.length >= end) {
    this.frame.data = this.buffer.slice(start, end);

    if (this.frame.masked) {
      // To decode the message, loopt through each byte in the encoded byte and
      // XOR the integer value with the (i modulo 4)th integer value in the keys.
      for (i = 0; i < this.frame.data.length; i++) {
        this.frame.data.writeUInt8((this.frame.data[i] ^ this.frame.mask[i % 4]), i);
      }
    }

    this.state = 6; // message read
  } else {
    this.state = 7; // incomplete message
  }
}

// Emit the frame and remove it from the buffer.
parser.prototype.emitFrame = function() {
  if (this.state !== 6) return;

  this.state = 8; // emitting message

  this.emit('frame', this.frame);

  // Remove the frame from the buffer.
  var totalLength = this.headerLength + (this.frame.masked ? 4 : 0) + this.frame.data.length;
  if (totalLength === this.buffer.length) {
    this.buffer = new Buffer(0);
  } else {
    this.buffer = this.buffer.slice(totalLength, this.buffer.length);
  }

  // Reset the frame.
  this.frame.reset();
  this.headerLength = undefined;
  this.state = 0;
}

module.exports = parser;