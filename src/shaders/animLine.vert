precision highp float;

attribute vec3 position;
attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float width;
attribute vec2 uv;
attribute float counters;
attribute float lineLength;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 resolution;
uniform float lineWidth;
uniform vec3 color;
uniform float opacity;
uniform float near;
uniform float far;
uniform float sizeAttenuation;

varying vec2 vUV;
varying vec4 vColor;
varying float vLineLength;
// varying vec2 vResolution;
// varying float vCounters;

vec2 fix( vec4 i, float aspect ) {

    vec2 res = i.xy / i.w;
    res.x *= aspect;
    // vCounters = counters;
    return res;

}

void main() {
  float aspect = resolution.x / resolution.y;
  float pixelWidthRatio = 1. / (resolution.x * projectionMatrix[0][0]);
  // float pixelWidthRatio = 1. / (resolution.y * projectionMatrix[0][0]);

  vColor = vec4( color, opacity );
  vUV = uv;
  vLineLength = lineLength;

  mat4 m = projectionMatrix * modelViewMatrix;
  vec4 finalPosition = m * vec4( position, 1.0 );
  vec4 prevPos = m * vec4( previous, 1.0 );
  vec4 nextPos = m * vec4( next, 1.0 );

  vec2 currentP = fix( finalPosition, aspect );
  vec2 prevP = fix( prevPos, aspect );
  vec2 nextP = fix( nextPos, aspect );

  float pixelWidth = finalPosition.w * pixelWidthRatio;
  float w = 1.8 * pixelWidth * lineWidth * width;

  if( sizeAttenuation == 1. ) {
      w = 1.8 * lineWidth * width;
  }

  vec2 dir;
  if( nextP == currentP ) dir = normalize( currentP - prevP );
  else if( prevP == currentP ) dir = normalize( nextP - currentP );
  else {
      vec2 dir1 = normalize( currentP - prevP );
      vec2 dir2 = normalize( nextP - currentP );
      dir = normalize( dir1 + dir2 );

      vec2 perp = vec2( -dir1.y, dir1.x );
      vec2 miter = vec2( -dir.y, dir.x );
      //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );
  }

  //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;
  vec2 normal = vec2( -dir.y, dir.x );
  normal.x /= aspect;
  normal *= .5 * w;

  vec4 offset = vec4( normal * side, 0.0, 1.0 );
  finalPosition.xy += offset.xy;

  // vLength = abs(distance(prevP, nextP));
  // vResolution = resolution;

  gl_Position = finalPosition;
}
