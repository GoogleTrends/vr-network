import * as THREE from 'three';

export const basic = new THREE.MeshBasicMaterial({
  color: 0x999999,
  flatShading: true,
  opacity: 0.35,
  transparent: true,
  depthTest: false,
});

export const adjacent = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  flatShading: true,
  opacity: 0.75,
  transparent: true,
  depthTest: false,
});

export const highlight = new THREE.MeshBasicMaterial({
  color: 0xfff000,
  flatShading: true,
  opacity: 1.0,
  transparent: true,
  depthTest: false,
});

// const sphereMaterial = (color, opacity) => {
//   return new THREE.MeshBasicMaterial({
//     color: new THREE.Color(color),
//     flatShading: true,
//     opacity: opacity,
//     transparent: true,
//     depthTest: false,
//   });
// }

// export default sphereMaterial;
