import * as THREE from 'three';
import { MeshLineMaterial } from '../../three_modules/THREE.MeshLine';

import animLineVertex from '../shaders/animLine.vert';
import animLineFragment from '../shaders/animLine.frag';

const linkWidth = 0.5;

// export const basic = new THREE.RawShaderMaterial({
//   uniforms: {
//     lineWidth: { type: 'f', value: (linkWidth / 100) },
//     map: { type: 't', value: null },
//     useMap: { type: 'f', value: 0 },
//     alphaMap: { type: 't', value: null },
//     useAlphaMap: { type: 'f', value: 0 },
//     color: { type: 'c', value: new THREE.Color(0xffffff) },
//     opacity: { type: 'f', value: 0.1 },
//     resolution: { type: 'v2', value: new THREE.Vector2(1, 1) },
//     sizeAttenuation: { type: 'f', value: 1 },
//     near: { type: 'f', value: 1 },
//     far: { type: 'f', value: 1 },
//     dashArray: { type: 'v2', value: [] },
//     useDash: { type: 'f', value: 0 },
//     visibility: { type: 'f', value: 1 },
//     alphaTest: { type: 'f', value: 0 },
//     repeat: { type: 'v2', value: new THREE.Vector2(1, 1) },
//     time: { type: 'f', value: 1 },
//   },
//   vertexShader: animLineVertex, // vertexShaderSource.join('\r\n'),
//   fragmentShader: animLineFragment, // fragmentShaderSource.join('\r\n'),
//   transparent: true,
// });

export const basic = new MeshLineMaterial({
  lineWidth: (linkWidth / 100),
  color: new THREE.Color(0xffffff),
  opacity: 0.05,
  transparent: true,
});

export const highlightOut = new THREE.RawShaderMaterial({
  uniforms: {
    lineWidth: { type: 'f', value: ((linkWidth * 4) / 100) },
    map: { type: 't', value: null },
    useMap: { type: 'f', value: 0 },
    alphaMap: { type: 't', value: null },
    useAlphaMap: { type: 'f', value: 0 },
    color: { type: 'c', value: new THREE.Color(0xf990ff) },
    opacity: { type: 'f', value: 0.5 },
    resolution: { type: 'v2', value: new THREE.Vector2(1, 1) },
    sizeAttenuation: { type: 'f', value: 1 },
    near: { type: 'f', value: 1 },
    far: { type: 'f', value: 1 },
    dashArray: { type: 'v2', value: [] },
    useDash: { type: 'f', value: 0 },
    visibility: { type: 'f', value: 1 },
    alphaTest: { type: 'f', value: 0 },
    repeat: { type: 'v2', value: new THREE.Vector2(1, 1) },
    time: { type: 'f', value: 1 },
  },
  vertexShader: animLineVertex, // vertexShaderSource.join('\r\n'),
  fragmentShader: animLineFragment, // fragmentShaderSource.join('\r\n'),
  transparent: true,
});

export const highlightIn = new THREE.RawShaderMaterial({
  uniforms: {
    lineWidth: { type: 'f', value: ((linkWidth * 4) / 100) },
    map: { type: 't', value: null },
    useMap: { type: 'f', value: 0 },
    alphaMap: { type: 't', value: null },
    useAlphaMap: { type: 'f', value: 0 },
    color: { type: 'c', value: new THREE.Color(0x90f9ff) },
    opacity: { type: 'f', value: 0.5 },
    resolution: { type: 'v2', value: new THREE.Vector2(1, 1) },
    sizeAttenuation: { type: 'f', value: 1 },
    near: { type: 'f', value: 1 },
    far: { type: 'f', value: 1 },
    dashArray: { type: 'v2', value: [] },
    useDash: { type: 'f', value: 0 },
    visibility: { type: 'f', value: 1 },
    alphaTest: { type: 'f', value: 0 },
    repeat: { type: 'v2', value: new THREE.Vector2(1, 1) },
    time: { type: 'f', value: 1 },
  },
  vertexShader: animLineVertex, // vertexShaderSource.join('\r\n'),
  fragmentShader: animLineFragment, // fragmentShaderSource.join('\r\n'),
  transparent: true,
});
