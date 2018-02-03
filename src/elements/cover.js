/*
  file: cover.js
  description: Generates cover to hide/transition in legend and button elements
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let cover = null;

export function generate() {
  cover = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 800),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1.0,
    }),
  );
  cover.scale.set(0.001, 0.001, 0.001);
  cover.position.set(0, 0.6, 0);
  cover.name = 'cover';
  return cover;
}

export function updateVisibility(buildOutInterval) {
  const baseOpacity = { opacity: 1 };
  new TWEEN.Tween(baseOpacity)
    .to({ opacity: 0 }, buildOutInterval)
    .onUpdate(() => {
      cover.material.opacity = baseOpacity.opacity;
    }).start();
}
