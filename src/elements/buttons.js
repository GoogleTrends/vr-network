import * as THREE from 'three';
import { generateTextureCanvas } from '../generateTextureCanvas';

export function generateButton(name, color, yoffset) {
  const button = new THREE.Group();
  button.userData.name = name;
  button.userData.type = 'button';
  button.scale.set(0.001, 0.001, 0.001);
  button.position.set(-0.025, yoffset, 0);
  const text = generateTextureCanvas(name, 36, 1024, 256); // 64
  text.userData.type = 'text';
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
  container.add(generateButton('Layout in Spiral', 0xFFFFFF, 0.1));
  // container.add(generateButton('Layout by Rank', 0xFFFFFF, 0));
  container.add(generateButton('Layout in Grid', 0xFFFFFF, -0.1));
  container.add(generateButton('Layout by Simulation', 0xFFFFFF, -0.3));
  //
  const updating = generateTextureCanvas('Updating...', 60, 1024, 256);
  updating.name = 'updating';
  updating.scale.set(0.001, 0.001, 0.001);
  updating.position.set(-0.025, -0.1, 0);
  container.add(updating);
  //
  container.position.set(1, 0.75, -1);
  container.rotation.set((Math.PI / 180) * -45, 0, 0);
  return container;
}

export default generateButtons;
