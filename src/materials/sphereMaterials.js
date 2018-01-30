import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let sphereMaterials = {};

export function updateSphereMaterials(state) {
  sphereMaterials = {};

  state.colorMap.forEach((c) => {
    const materials = {};

    materials.basic = new THREE.MeshBasicMaterial({
      color: new THREE.Color(c.color),
      flatShading: false,
      opacity: 0,
      transparent: true,
      depthTest: true,
    });

    materials.adjacent = new THREE.MeshPhongMaterial({
      color: new THREE.Color(c.color),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    materials.selected = new THREE.MeshPhongMaterial({
      color: new THREE.Color(c.color),
      emissive: new THREE.Color(c.color),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    materials.highlight = new THREE.MeshPhongMaterial({
      color: new THREE.Color(c.color),
      emissive: new THREE.Color(c.color),
      flatShading: false,
      transparent: false,
      depthTest: true,
    });

    sphereMaterials[c.name] = materials;
  });

  return sphereMaterials;
}

export function updateSphereOpacity() {
  const categories = Object.keys(sphereMaterials);
  categories.forEach((m) => {
    const material = sphereMaterials[m];
    new TWEEN.Tween(material.basic)
      .to({
        opacity: 0.35,
      }, 500)
      .start();
  });
}
