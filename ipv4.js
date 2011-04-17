
function ipv4_to_int (x) {
  x = x.split(/\./g).reverse();
  var y = 0;
  var pow = 1;
  for (var i = 0, n = x.length; i < n; ++i) {
    y += pow * x[i];
    pow <<= 8;
  };
  return y;
};

function int_to_ipv4 (x) {
  var y = [];
  for (var i = 0, n = 4; i < n; ++i) {
    y.push(x % Math.pow(2, 8));
    x >>>= 8;
  };
  return y.reverse().join('.');
};

function ipv4_to_coords (ip, r, a, b, lo, hi, rot) {
  if (!a) a = r;
  if (!b) b = r;
  if (!lo) lo = 0;
  if (!hi) hi = Math.pow(2, 32) - 1;
  var t = 2 * Math.PI * (ipv4_to_int(ip) - lo) / (hi - lo);
  if (rot) t += rot;
  return [
    Math.floor(a + r * Math.cos(t)), // x
    Math.floor(b + r * Math.sin(t))  // y
  ];
};

try {
  exports.from_int = int_to_ipv4;
  exports.to_int = ipv4_to_int;
  exports.to_coords = ipv4_to_coords;
} catch (e) { /* nop */ };
