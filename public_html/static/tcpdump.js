
host_fillStyle = {};
host_fillStyle['10.42.2.248'] = '#ff00ff';
host_fillStyle['10.42.2.232'] = '#aa00ff';
host_fillStyle['10.42.3.242'] = '#ff0000';
host_fillStyle['10.42.0.1'] = '#00ff00';

// deepmix
host_fillStyle['89.179.179.5'  ] = '#00aeef';
host_fillStyle['69.163.134.109'] = '#00aeef';
host_fillStyle['194.183.224.59'] = '#00aeef';
host_fillStyle['91.121.10.128' ] = '#00aeef';
host_fillStyle['178.32.93.168' ] = '#00aeef';
host_fillStyle['83.169.42.180' ] = '#00aeef';


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


function draw_packet(context, x, y, packet, radius, lo, hi, date, gw) {

  var src = packet.src;
  var dst = packet.dst;

  if (gw) {
    if (!inside(ipv4_to_int(src), lo, hi)) src = gw;
    if (!inside(ipv4_to_int(dst), lo, hi)) dst = gw;
  };

  src = ipv4_to_coords(src, radius, radius, radius, lo, hi);
  dst = ipv4_to_coords(dst, radius, radius, radius, lo, hi);

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
  gradient.addColorStop((date - packet.date) / 1000, 'rgba(255,255,255,0)');
  context.strokeStyle = gradient;
  context.lineWidth = Math.min(packet.n, 1);
  context.stroke();
};

function draw_host(context, x, y, host, radius, size, lo, hi, gw) {

  context.fillStyle = host_fillStyle[host] || '#ffffff';

  if (gw) {
    if (!inside(ipv4_to_int(host), lo, hi)) host = gw;
  };

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
  var date = new Date();

  delete_old_packets(packets, date);
  var weights = packets_to_host_weights(packets);

  // TODO only redraw when visible world has changed...
  context.fillStyle = '#000044';
  context.fillRect(0, 0, canvas.width, canvas.height);

  var n = Math.min(canvas.width, canvas.height) - 2 * 8;

  render_net(context,
      8,
      8,
      n / 2,
      date, weights, packets
      /*, Internet gw, lo, hi */);

  render_net(context,
      8 + n + 8 + 8,
      8,
      n / 2,
      date, weights, packets,
      '10.42.0.1', '10.42.0.0', '10.42.5.255');
};

function delete_old_packets (packets, date) {
  Object.keys(packets).forEach(function (key) {
    if (date - packets[key].date >= 1000) {
      delete packets[key];
    };
  });
};

function packets_to_host_weights (x) {
  var y = {};
  Object.keys(x).forEach(function (key) {
    var packet = x[key];
    y[packet.src] = packet.src in y ? y[packet.src] + 1 : 3;
    y[packet.dst] = packet.dst in y ? y[packet.dst] : 3;
  });
  Object.keys(x).forEach(function (key) {
    var packet = x[key];
    y[packet.src] = normalize_weight(y[packet.src]);
    y[packet.dst] = normalize_weight(y[packet.dst]);
  });
  return y;
};

function normalize_weight(x) {
  return Math.min(Math.max(x, 3), 12);
};

function render_net (context, x, y, r, date, weights, packets, gw, lo, hi) {
  context.beginPath();
  // context#arc(x, y, radius, startAngle, endAngle [, anticlockwise])
  context.arc(x + r, y + r, r, 0, Math.PI * 2, true);
  context.closePath();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1;
  context.stroke();

  if (lo) lo = ipv4_to_int(lo);
  if (hi) hi = ipv4_to_int(hi);

  Object.keys(packets).forEach(function (key) {
    draw_packet(context, x, y, packets[key], r, lo, hi, date, gw);
  });

  // TODO sort by size
  Object.keys(weights).forEach(function (host) {
    draw_host(context, x, y, host, r, Math.min(Math.max(weights[host], 3), 12), lo, hi, gw);
  });
};

var packets = {};
function add_packet(src, dst) {
  var n = src+dst in packets ? packets[src+dst].n + 1 : 1;
  packets[src+dst] = {date: new Date(), src: src, dst: dst, n: n};
};


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

