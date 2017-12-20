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
