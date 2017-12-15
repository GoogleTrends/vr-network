import * as THREE from 'three';

import horizonVertex from './shaders/horizon.vert';
import horizonFragment from './shaders/horizon.frag';

export function generateHorizon(topColor, bottomColor, exponent) {
  const uniforms = {
    topColor: { type: 'c', value: new THREE.Color(topColor) },
    bottomColor: { type: 'c', value: new THREE.Color(bottomColor) },
    offset: { type: 'f', value: 33 },
    exponent: { type: 'f', value: exponent },
  };
  const skyGeo = new THREE.SphereGeometry(4000, 32, 15, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: horizonVertex,
    fragmentShader: horizonFragment,
    side: THREE.BackSide,
  });
  const horizon = new THREE.Mesh(skyGeo, skyMat);
  horizon.name = 'horizon';
  return horizon;
}

export default generateHorizon;
