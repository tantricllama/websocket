# WebSocket Server

Basic WebSocket Server/Client example. 

## Usage

### Server

```
// Run the app
node index.js
```

### Client

```
// Establish a connection to the server.
var socket = new WebSocket('ws://localhost:666');
socket.onopen = function() {
  console.log('connected');
}
```

```
// Send messages using a queue to ensure all messages are sent.
var queue = [];
socket.onopen = function() {
  setInterval(function() {
    if (socket.bufferedAmount === 0 && queue.length > 0) {
      socket.send(queue.shift());
    }
  }, 50);
}

// Queue messages
queue.push('example');
```

```
// Receive messages using the socket's onmessage event.
socket.onmessage = function(event) {
  console.log('received message: ' + event.data);
}
```

### Test Page

Go to http://localhost:3000 in the browser.
