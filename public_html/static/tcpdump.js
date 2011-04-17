
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
      //setInterval(step, 1000/30);
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


function draw_packet(context, x, y, packet, radius) {
  src = ipv4_to_coords(packet.src, radius);
  dst = ipv4_to_coords(packet.dst, radius);

  var x1 = x + src[0];
  var y1 = y + src[1];
  var x2 = x + dst[0];
  var y2 = y + dst[1];

  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.closePath();

  context.strokeStyle = '#ffffff';
  var gradient = context.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(1, 'rgba(255,255,255,1)');
  gradient.addColorStop((new Date() - packet.date) / 1000, 'rgba(255,255,255,0)');
  context.strokeStyle = gradient;
  context.lineWidth = 1;
  context.stroke();
};

function draw_host(context, x, y, host, radius, size) {
  host = ipv4_to_coords(host, radius);

  x = x + host[0];
  y = y + host[1];

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(x, y, size, 0, Math.PI * 2, true);
  context.closePath();
  context.stroke();
  context.fill();
  return;

  //context.fillStyle = '#ffffff';
  //context.fillRect(
  //  x + host[0] - size/2,
  //  y + host[1] - size/2,
  //  size, size
  //);
};

var render = function () {
  // TODO only redraw when visible world has changed...
  context.fillStyle = '#000044';

  context.fillRect(0, 0, canvas.width, canvas.height);

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

  //var senders = {};
  //var recvers = {};

  var hosts = {};

  var new_packets = {};
  
  var date = new Date();

  Object.keys(packets).forEach(function (key) {
    var packet = packets[key];
    if (date - packet.date < 1000) {
      draw_packet(context, x, y, packet, r);
      //if (packet.src in senders) senders[packet.src]++;
      //else senders[packet.src] = 1;
      //if (packet.dst in recvers) recvers[packet.dst]++;
      //else recvers[packet.dst] = 1;
      hosts[packet.src] = packet.src in hosts ? hosts[packet.src] : 1;
      hosts[packet.dst] = packet.dst in hosts ? hosts[packet.dst] + 1 : 1;
      new_packets[key] = packet;
    };
  });

  packets = new_packets;

  // TODO sort by size
  Object.keys(hosts).forEach(function (host) {
    draw_host(context, x, y, host, r, Math.min(Math.max(hosts[host], 3), 12));
  });

  //objects.forEach(function (object) {
  //  object.render();
  //});
};

var packets = {};
function add_packet(src, dst) {
  packets[src+dst] = {date: new Date(), src: src, dst: dst};
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

