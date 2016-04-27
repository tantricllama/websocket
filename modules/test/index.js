var exports = module.exports = {},
  http = require('http'),
  fs = require('fs');

function handleRequest(request, response) {
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
}

exports.listen = function(port) {
  http.createServer(handleRequest)
    .listen(port, function() {
      console.log('test server listening on http://localhost:%s', port);
    });
};