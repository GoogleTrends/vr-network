precision highp float;
precision mediump int;

uniform float time;

varying vec2 vUV;
varying vec4 vColor;

void main() {
  float yCurve = cos((vUV.y - 0.5) * 5.0);
  float xCurve = sin(cos(vUV.x * 100.0 - time));

  vec4 color = vec4( vColor );
  color.a = (yCurve + xCurve) * color.a;
  gl_FragColor = color;
}
