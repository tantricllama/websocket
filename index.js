var exports = module.exports = {},
  http = require('http'),
  fs = require('fs')
  websocket = require('./modules/websocket/server.js');

http.createServer(function(request, response) {
  console.log('request: %s %s', request.method, request.url);

  if (request.method === 'GET' && request.url === '/') {
    var stream = fs.createReadStream('./modules/test/views/index.html', { flags: 'r', encoding: 'utf-8' });

    response.writeHead(200);
    stream.pipe(response);

    stream.on('close', function() {
      response.end();
    });
  } else {
    response.writeHead(404);
    response.end('404: File not found');
  }
}).listen(3000);

websocket.on('text', function(text) {
  console.log(text.toString());
  websocket.write(text.toString());
}).listen(666);