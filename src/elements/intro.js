/* global Flourish */

import * as THREE from 'three';
import { generateTextureCanvas } from '../generateTextureCanvas';

function generateIntroButton(name, image, width, yoffset, innerYOffset, zoffset) {
  const button = new THREE.Group();
  button.name = name;
  button.userData.type = name;
  const text = generateTextureCanvas(name, 36, width / 2, width / 2, '', false);
  text.position.set(width / 4.75, innerYOffset, 64);
  text.userData.type = 'text';
  button.add(text);
  const rect = new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width / 2) * 0.65),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFFFFF'),
      transparent: true,
      opacity: 0.1,
    }),
  );
  rect.position.set(0, 0, 1);
  rect.userData.type = 'button';
  button.add(rect);
  //
  const textureLoader = new THREE.TextureLoader();
  const imgGeometry = new THREE.PlaneGeometry(256, 256);
  const imgMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/${image}`),
    transparent: true,
    depthTest: false,
  });
  const icon = new THREE.Mesh(imgGeometry, imgMaterial);
  icon.scale.set(0.65, 0.65, 0.65);
  icon.position.set(-width / 4.75, innerYOffset, 64);
  button.add(icon);
  //
  // button.scale.set(0.8, 0.8, 0.8);
  button.scale.set(0.906, 0.906, 0.906);
  button.position.set(0, yoffset, zoffset);
  return button;
}

export function generate(state, stageSize) {
  const intro = new THREE.Group();
  intro.name = 'intro';

  const width = 512;
  const height = 512;

  const backgroundGeometry = new THREE.PlaneGeometry(width, height);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: state.horizonBottomColor,
    transparent: true,
    opacity: 0.75,
    depthTest: false,
  });
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  intro.add(background);

  const rectSize = 220;
  const textureLoader = new THREE.TextureLoader();
  const imgGeometry = new THREE.PlaneGeometry(rectSize, rectSize);

  const cursor = new THREE.Group();
  const cursorMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/cursor.png`),
    transparent: true,
    depthTest: false,
  });
  cursor.add(new THREE.Mesh(imgGeometry, cursorMaterial));
  const cursorText = generateTextureCanvas('Look at any node to show it\'s connections', 36, 512, 256, '', true);
  cursorText.scale.set(0.43, 0.43, 0.43);
  cursorText.position.set(0, -166, 0);
  cursor.add(cursorText);
  cursor.position.set(-122, 122, 1);
  intro.add(cursor);

  const fuse = new THREE.Group();
  const fuseMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/fuse.png`),
    transparent: true,
    depthTest: false,
  });
  fuse.add(new THREE.Mesh(imgGeometry, fuseMaterial));
  const fuseText = generateTextureCanvas('When the cursor fills, the connected nodes will be brought into view', 36, 512, 256, '', true);
  fuseText.scale.set(0.43, 0.43, 0.43);
  fuseText.position.set(0, -166, 0);
  fuse.add(fuseText);
  fuse.position.set(122, 122, 1);
  intro.add(fuse);

  const ready = generateIntroButton('Ready?', 'cardboard.png', 512, -160, 16, 0);
  intro.add(ready);

  intro.scale.set(0.01, 0.01, 0.01);
  intro.position.set(0, 1.5, stageSize / 4);

  return intro;
}

export default generate;
