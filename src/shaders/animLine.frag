precision mediump float;
precision mediump int;

uniform float time;

varying vec2 vUV;
varying vec4 vColor;

void main() {
  vec4 color = vec4( vColor );
  // color.a -= sin(vUV.x * 500.0 - time) * color.a;
  float yCurve = cos((vUV.y - 0.5) * 5.0);
  float xCurve = sin(vUV.x * 250.0 - time);
  color.a = (yCurve + xCurve) * color.a;
  gl_FragColor = color;
}
