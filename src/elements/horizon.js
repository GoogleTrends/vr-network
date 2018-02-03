/*
  file: horizon.js
  description: Generates horizon and sky dome
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

import horizonVertex from '../shaders/horizon.vert';
import horizonFragment from '../shaders/horizon.frag';

const skyGeo = new THREE.SphereGeometry(4000, 32, 15, 0, Math.PI * 2, 0, Math.PI / 2);
let skyMat = null;
let uniforms = null;
let targetExponent = 0;
export function generateHorizon(topColor, bottomColor, exponent, animate = true) {
  targetExponent = exponent;
  uniforms = {
    topColor: { type: 'c', value: new THREE.Color(topColor) },
    bottomColor: { type: 'c', value: new THREE.Color(bottomColor) },
    offset: { type: 'f', value: 33 },
    exponent: { type: 'f', value: animate ? 0 : exponent },
  };
  skyMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: horizonVertex,
    fragmentShader: horizonFragment,
    side: THREE.BackSide,
  });
  const horizon = new THREE.Mesh(skyGeo, skyMat);
  horizon.name = 'horizon';
  return horizon;
}

export function updateHorizonVisibility(buildOutInterval) {
  new TWEEN.Tween(uniforms.exponent)
    .to({
      value: targetExponent,
    }, buildOutInterval)
    .start();
}
