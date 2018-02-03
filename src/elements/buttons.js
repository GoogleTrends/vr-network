/* global Flourish */

/*
  file: buttons.js
  description: Generates layout selection buttons
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

import * as THREE from 'three';
import { generateTextureCanvas } from '../actions/generateTextureCanvas';

const textureLoader = new THREE.TextureLoader();
const imgGeometry = new THREE.PlaneGeometry(256, 256);

export function generateButton(name, color, yoffset) {
  const button = new THREE.Group();
  button.userData.name = name;
  button.userData.type = 'button';
  button.scale.set(0.001, 0.001, 0.001);
  button.position.set(-0.025, yoffset, 0);
  const iconMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/${name}.png`),
    transparent: true,
    depthTest: false,
  });
  const icon = new THREE.Mesh(imgGeometry, iconMaterial);
  icon.scale.set(0.4, 0.4, 0.4);
  icon.position.set(-192, 0, 0);
  button.add(icon);
  const text = generateTextureCanvas(name, 60, 512, 128, '', true);
  text.userData.type = 'text';
  text.position.set(160, 0, 0);
  button.add(text);
  const rect = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 150),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.1,
    }),
  );
  rect.position.set(-0.01, -0.01, -0.01);
  rect.userData.type = 'button';
  button.add(rect);
  return button;
}

export function generateButtons(container) {
  const title = generateTextureCanvas('Layout', 60, 512, 128, '', true);
  title.name = 'title';
  title.scale.set(0.001, 0.001, 0.001);
  title.position.set(0.1325, 0.175, 0);
  container.add(title);
  container.add(generateButton('Spiral', 0xFFFFFF, 0.0));
  container.add(generateButton('Grid', 0xFFFFFF, -0.175));
  container.add(generateButton('Simulation', 0xFFFFFF, -0.35));
  const updating = generateTextureCanvas('Updating...', 60, 1024, 256);
  updating.name = 'updating';
  updating.scale.set(0.001, 0.001, 0.001);
  updating.position.set(-0.025, -0.175, 0);
  container.add(updating);
  container.position.set(0.45, 0.65, -0.867);
  container.rotation.set((Math.PI / 180) * -45, 0, 0);
  return container;
}

export default generateButtons;
