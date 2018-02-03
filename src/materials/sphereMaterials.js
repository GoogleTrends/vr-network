/*
  file: sphereMaterials.js
  description: Generates and updates sphere materials for each categories or selection state
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let sphereMaterials = {};

export function updateSphereMaterials(state) {
  sphereMaterials = {};

  state.colorMap.forEach((c) => {
    const materials = {};

    const basicColor = (c.name === 'default_no_category') ? c.basic : c.color;
    const adjacentColor = (c.name === 'default_no_category') ? c.adjacent : c.color;
    const highlightColor = (c.name === 'default_no_category') ? c.highlight : c.color;

    materials.basic = new THREE.MeshBasicMaterial({
      color: new THREE.Color(basicColor),
      flatShading: false,
      opacity: 0,
      transparent: true,
      depthTest: true,
    });

    materials.adjacent = new THREE.MeshPhongMaterial({
      color: new THREE.Color(adjacentColor),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    materials.selected = new THREE.MeshPhongMaterial({
      color: new THREE.Color(highlightColor),
      emissive: new THREE.Color(highlightColor),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    materials.highlight = new THREE.MeshPhongMaterial({
      color: new THREE.Color(highlightColor),
      emissive: new THREE.Color(highlightColor),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    sphereMaterials[c.name] = materials;
  });

  return sphereMaterials;
}

export function updateSphereOpacity(buildOutInterval) {
  const categories = Object.keys(sphereMaterials);
  categories.forEach((m) => {
    const targetOpacity = (m === 'default_no_category') ? 1 : 0.35;
    const material = sphereMaterials[m];
    new TWEEN.Tween(material.basic)
      .to({
        opacity: targetOpacity,
      }, buildOutInterval)
      .start();
  });
}
