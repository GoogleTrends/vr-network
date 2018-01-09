precision highp float;
precision mediump int;

uniform float time;

varying vec2 vUV;
varying vec4 vColor;
// varying vec2 vResolution;

void main() {
  vec4 color = vec4( vColor );
  // color.a -= sin(vUV.x * 500.0 - time) * color.a;

  vec2 dist = vUV - vec2(0.5);
  float radius = 1.0;
  float circle = 1.0 - smoothstep(
    radius,
    radius,
    dot(dist, dist) * 4.0
  );

  float yCurve = cos((vUV.y - 0.5) * 5.0);
  float xCurve = sin(vUV.x * 100.0 - time);
  
  // float xCurve = sin((vUV.x - time) * 1000.0);
  // float xCurve = sin((vUV.x * (vLength * 100.0)) - time);
  
  color.a = ((yCurve + xCurve) - circle) * color.a;
  gl_FragColor = color;
}
