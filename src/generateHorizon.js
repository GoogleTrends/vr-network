import * as THREE from 'three';

import horizonVertex from './shaders/horizon.vert';
import horizonFragment from './shaders/horizon.frag';

export function generateHorizon() {
  const uniforms = {
    topColor: { type: 'c', value: new THREE.Color(0x000000) },
    bottomColor: { type: 'c', value: new THREE.Color(0xff7700) },
    offset: { type: 'f', value: 33 },
    exponent: { type: 'f', value: 0.05 },
  };
  const skyGeo = new THREE.SphereGeometry(4000, 32, 15, 0, Math.PI * 2, 0, Math.PI / 2);
  const skyMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: horizonVertex,
    fragmentShader: horizonFragment,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(skyGeo, skyMat);
}

export default generateHorizon;
