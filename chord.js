
// a perimeter is a path that surrounds an area.
// a circumference is the distance around the outside of a circle.
//    c = π d = π 2 r
// a chord is a line segment whose endpoints lie on the circumference.
// a diameter is the longest chord in a circle.
// a radius is half the diameter, touching the circumference at one point.
// a tangent to a circle is a line that touches the circle at a single point.
// a secant is an extended chord: a line cutting the circle at two points.
// an arc of a circle is any connected part of the circle's circumference.
// a sector is a region bounded by two radii and an arc lying in between.
// a segment iis a region bound by a chord and an arc.


circle = (x, y, r)

radius(circle) => r
x(circle) => x
y(circle) => y


// circumference (distance)

// chord (circle, point, point)

// diameter (circle)
// radius (circle)

// tangent (circle, point)
// secant (circle, point, point)
// arc (circle, point, point)
// sector (circle, point, point)
// segment (circle, point, point)




world.line.draw
world.arc.draw



function arc_point(


function circle_coord (ip, r, a, b, lo, hi, rot) {
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

