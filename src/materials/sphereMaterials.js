import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export const basic = new THREE.MeshBasicMaterial({
  color: 0x262626,
  // emissive: 0x262626,
  flatShading: true,
  opacity: 0,
  transparent: true,
  depthTest: true,
});

export const adjacent = new THREE.MeshPhongMaterial({
  color: 0x848484,
  // emissive: 0x848484,
  flatShading: false,
  // opacity: 0.75,
  transparent: false,
  depthTest: true,
});

export const selected = new THREE.MeshPhongMaterial({
  color: 0xFF6F00,
  emissive: 0xFF6F00,
  flatShading: false,
  // opacity: 1.0,
  transparent: false,
  depthTest: true,
});

export const highlight = new THREE.MeshPhongMaterial({
  color: 0xFF6F00,
  emissive: 0xFF6F00,
  flatShading: false,
  // opacity: 1.0,
  transparent: false,
  depthTest: true,
});


export function updateSphereMaterial() {
  new TWEEN.Tween(basic)
    .to({
      opacity: 1,
    }, 500)
    .onComplete(() => {
      basic.transparent = false;
    })
    .start();
}
