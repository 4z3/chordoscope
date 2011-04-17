
var load = function () {
  canvas = document.createElement('canvas');
  world  = document.createElement('div');
  if (canvas && canvas.getContext) {
    document.body.appendChild(canvas);
    document.body.appendChild(world);
    context = canvas.getContext('2d');
    if (context) {
      init();
      resize();
      setInterval(function () { step(); render() }, 1000/30);
    };
  };
};
window.onload = load;

var init = function () {
};

var resize = function () {
  if (canvas.width === window.innerWidth &&
      canvas.height === window.innerHeight) {
    return; // fast path
  };
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  context.fillStyle = '#000044';
  context.fillRect(0, 0, canvas.width, canvas.height);
  buffer = context.getImageData(0, 0, canvas.width, canvas.height);
  //console.log('resize', canvas.width, canvas.height);
};
window.onresize = resize;

var step = function () {
};


function draw_packet(context, x, y, packet, radius, lo, hi) {
  src = ipv4_to_coords(packet.src, radius, radius, radius, lo, hi);
  dst = ipv4_to_coords(packet.dst, radius, radius, radius, lo, hi);

  var x1 = x + src[0];
  var y1 = y + src[1];
  var x2 = x + dst[0];
  var y2 = y + dst[1];

  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.closePath();

  var c = Math.min(1, packet.n / 32);

  context.strokeStyle = '#ffffff';
  var gradient = context.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(1, 'rgba(255,255,255,'+c+')');
  gradient.addColorStop((new Date() - packet.date) / 1000, 'rgba(255,255,255,0)');
  context.strokeStyle = gradient;
  context.lineWidth = Math.min(packet.n, 1);
  context.stroke();
};

function draw_host(context, x, y, host, radius, size, lo, hi) {
  host = ipv4_to_coords(host, radius, radius, radius, lo, hi);

  x = x + host[0];
  y = y + host[1];

  context.beginPath();
  context.arc(x, y, size, 0, Math.PI * 2, true);
  context.closePath();
  context.stroke();
  context.fill();
};

var render = function () {
  // TODO only redraw when visible world has changed...
  context.fillStyle = '#000044';
  //context.fillRect(0, 0, canvas.width, canvas.height);

  var new_packets = {};

  var n = Math.min(canvas.width, canvas.height) - 2 * 8;
  var r = n / 2;
  var x = 8;
  var y = 8;

  context.beginPath();
  // context#arc(x, y, radius, startAngle, endAngle [, anticlockwise])
  context.arc(x + r, y + r, r, 0, Math.PI * 2, true);
  context.closePath();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1;
  context.stroke();

  var hosts = {};
  var date = new Date();

  Object.keys(packets).forEach(function (key) {
    var packet = packets[key];
    if (date - packet.date < 1000) {
      draw_packet(context, x, y, packet, r);
      hosts[packet.src] = packet.src in hosts ? hosts[packet.src] : 1;
      hosts[packet.dst] = packet.dst in hosts ? hosts[packet.dst] + 1 : 1;
      new_packets[key] = packet;
    };
  });

  // TODO sort by size
  context.fillStyle = '#ffffff';
  Object.keys(hosts).forEach(function (host) {
    draw_host(context, x, y, host, r, Math.min(Math.max(hosts[host], 3), 12));
  });

  // external IP
  context.fillStyle = '#00ff00';
  draw_host(context, x, y, '10.42.0.1', r, 5, lo, hi);

  // deepmix
  context.fillStyle = '#00aeef';
  [ '89.179.179.5',
  '69.163.134.109',
  '194.183.224.59',
  '91.121.10.128',
  '178.32.93.168',
  '83.169.42.180'].forEach(function (host) {
    draw_host(context, x, y, host, r, 3, lo, hi);
  });

  ////
  //// 10.42/16
  ////
  var r = n / 2;
  var x = 8 + n + 8 + 8;
  var y = 8;
  context.beginPath();
  // context#arc(x, y, radius, startAngle, endAngle [, anticlockwise])
  context.arc(x + r, y + r, r, 0, Math.PI * 2, true);
  context.closePath();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1;
  context.stroke();

  var hosts = {};
  var date = new Date();

  var gw = '10.42.0.1';
  var lo = ipv4_to_int('10.42.0.0');
  var hi = ipv4_to_int('10.42.4.255');

  Object.keys(packets).forEach(function (key) {
    var packet = packets[key];
    if (date - packet.date < 1000) {
      var src = ipv4_to_int(packet.src);
      var dst = ipv4_to_int(packet.dst);
      packet.src = inside(src, lo, hi) ? packet.src : gw;
      packet.dst = inside(dst, lo, hi) ? packet.dst : gw;

      draw_packet(context, x, y, packet, r, lo, hi);
      hosts[packet.src] = packet.src in hosts ? hosts[packet.src] : 1;
      hosts[packet.dst] = packet.dst in hosts ? hosts[packet.dst] + 1 : 1;
      new_packets[key] = packet;
    };
  });

  // TODO sort by size
  context.fillStyle = '#ffffff';
  Object.keys(hosts).forEach(function (host) {
    draw_host(context, x, y, host, r, Math.min(Math.max(hosts[host], 3), 12), lo, hi);
  });

  context.fillStyle = '#00ff00';
  draw_host(context, x, y, gw, r, 5, lo, hi);

  context.fillStyle = '#ff00ff';
  draw_host(context, x, y, '10.42.2.248', r, 5, lo, hi);

  context.fillStyle = '#aa00ff';
  draw_host(context, x, y, '10.42.2.232', r, 3, lo, hi);

  context.fillStyle = '#ff0000';
  draw_host(context, x, y, '10.42.3.242', r, 5, lo, hi);


  packets = new_packets;
};

var packets = {};
function add_packet(src, dst) {
  var n = src+dst in packets ? packets[src+dst].n + 1 : 1;
  packets[src+dst] = {date: new Date(), src: src, dst: dst, n: n};
};


if (false)
(function rec () {
  var src = int_to_ipv4(Math.random()*Math.pow(2,32));
  var dst = int_to_ipv4(Math.random()*Math.pow(2,32));
  add_packet(src, '42.0.0.1');
  add_packet(src, dst);
  setTimeout(rec, Math.random() * 1000);
})();


var socket = new io.Socket();
socket.connect();
//socket.on('connect' 'disconnect'
socket.on('message', function (message) {
  //console.log(message);
  message = JSON.parse(message);
  add_packet(message[0], message[1]);
});


//// lib

function inside (x, lo, hi) {
  return lo <= x && x <= hi;
};

