
util = require('util');
spawn = require('child_process').spawn;
log = console.log;
IPv4 = require('./ipv4');
var http = require('http');
var router = require('choreographer').router();

// TODO rewrite /static/foo -> __dirname + /public_html/foo
var static = require('./static').make_static_server('public_html');

router.get('/static/*', static);

var server = http.createServer(router);
server.listen(8001);

var io = require('socket.io');
var socket = io.listen(server);
var clients = {};
var broadcast = (function () {
  var last = new Date();
  var buf = {};
  return function (x) {
    var key = JSON.stringify(x);
    if (key in buf) {
      buf[key]++;
    } else {
      buf[key] = 1;
    };
    var now = new Date();
    if ((now - last) > 1000/30) {
      Object.keys(buf).forEach(function (key) {
        var m = key.replace(']', ',' + buf[key] + ']');
        Object.keys(clients).forEach(function (key) {
          var client = clients[key];
          client.send(m);
        });
      });
      buf = {};
      last = now;
    };
  };
})();

socket.on('connection', (function (last_key) {
  return function (client) {
    var key = ++last_key;
    clients[key] = client;
    client.on('disconnect', function () {
      delete clients[key];
    });
  };
})(0));

tcpdump = spawn('sudo', [ 'tcpdump-as-nobody' ]);

tcpdump.stdout.on('data', function (data) {
  data.toString().split(/\n/g).forEach(function (line) {
    var info = /^IP ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.([0-9]+) > ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.([0-9]+).*/.exec(line);
    if (info) {
      broadcast([info[1],info[3]]);
    };
  });
});

