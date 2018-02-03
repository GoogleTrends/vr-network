/*
  file: lookup.js
  description: Generates arrow directing users away from bottom of scene
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

/* global Flourish */

import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export function generate() {
  const lookup = new THREE.Group();
  const imgGeometry = new THREE.PlaneGeometry(512, 256);
  const lookMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/lookup.png`),
    transparent: true,
    depthTest: false,
  });
  lookup.add(new THREE.Mesh(imgGeometry, lookMaterial));
  lookup.name = 'lookup';
  lookup.rotation.set((Math.PI / 180) * -45, 0, 0);
  lookup.scale.set(0.0025, 0.0025, 0.0025);
  return lookup;
}

export default generate;
