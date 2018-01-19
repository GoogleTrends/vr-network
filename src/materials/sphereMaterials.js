import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

const sphereMaterials = {};

export function updateSphereMaterials(state) {
  sphereMaterials.basic = new THREE.MeshBasicMaterial({
    color: new THREE.Color(state.basicNodeColor),
    flatShading: true,
    opacity: 0,
    transparent: true,
    depthTest: true,
  });

  sphereMaterials.adjacent = new THREE.MeshPhongMaterial({
    color: new THREE.Color(state.adjacentNodeColor),
    flatShading: false,
    transparent: false,
    depthTest: true,
  });

  sphereMaterials.selected = new THREE.MeshPhongMaterial({
    color: new THREE.Color(state.highlightNodeColor),
    emissive: new THREE.Color(state.highlightNodeColor),
    flatShading: false,
    transparent: false,
    depthTest: true,
  });

  sphereMaterials.highlight = new THREE.MeshPhongMaterial({
    color: new THREE.Color(state.highlightNodeColor),
    emissive: new THREE.Color(state.highlightNodeColor),
    flatShading: false,
    transparent: false,
    depthTest: true,
  });

  return sphereMaterials;
}

export function updateSphereOpacity() {
  new TWEEN.Tween(sphereMaterials.basic)
    .to({
      opacity: 1,
    }, 500)
    .onComplete(() => {
      sphereMaterials.basic.transparent = false;
    })
    .start();
}
