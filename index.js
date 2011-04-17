
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
var client_send = function () {};
socket.on('connection', function (client) {
  client_send = function (x) {
    client.send(x);
  };
});


tcpdump = spawn('sudo', [ 'tcpdump-as-nobody' ]);

tcpdump.stdout.on('data', function (data) {
  var r = 25;
  var a = r, b = r;
  data.toString().split(/\n/g).forEach(function (line) {
    var info = /^IP ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.([0-9]+) > ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\.([0-9]+).*/.exec(line);
    if (info) {
      var src = IPv4.to_coords(info[1], r);
      var dst = IPv4.to_coords(info[3], r);

      if (JSON.stringify(src) != JSON.stringify(dst)) {
        log(+new Date, src, dst);
        client_send(JSON.stringify([info[1],info[3]]));
      };
    };
  });
  //console.log('data', //.exec(data));
});


//function print_javascript() {
//  console.log(''
//    + IPv4.to_coords.toString() + ';'
//    + IPv4.to_int.toString()
//    + IPv4.to_int.toString()
//  );
//};
//
//print_javascript();
