/* global document, Flourish */

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
  button.scale.set(0.8, 0.8, 0.8);
  button.position.set(0, yoffset, zoffset);
  return button;
}

export function generate(state, stageSize) {
  const intro = new THREE.Group();
  intro.name = 'intro';

  const width = 512;
  const zoffset = 64;

  const backgroundGeometry = new THREE.PlaneGeometry(width, width);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: state.horizonBottomColor,
    transparent: true,
    opacity: 0.75,
    depthTest: false,
  });
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  intro.add(background);

  const imgHeight = 128;
  const image = document.createElement('img');
  const texture = new THREE.Texture(image);
  image.onload = () => { texture.needsUpdate = true; };
  image.src = state.logo;
  const logoGeometry = new THREE.PlaneGeometry(width, imgHeight);
  const logoMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    map: texture,
    depthTest: false,
  });
  const logo = new THREE.Mesh(logoGeometry, logoMaterial);
  logo.name = 'logo';
  logo.scale.set(0.8, 0.8, 0.8);
  logo.position.set(0, 160, zoffset);
  intro.add(logo);

  const title = generateTextureCanvas(state.title, 36, width, 128, '', true);
  title.name = 'title';
  title.scale.set(0.8, 0.8, 0.8);
  title.position.set(0, 64, zoffset);
  intro.add(title);

  //
  const headset = generateTextureCanvas('Place Your Phone In Your Headset Now!', 36, width, 128, '', true);
  headset.name = 'headset';
  headset.scale.set(0.8, 0.8, 0.8);
  headset.position.set(0, -160, zoffset);
  headset.visible = false;
  intro.add(headset);
  //

  const description = generateTextureCanvas(state.description, 18, width, 64, '', true);
  description.name = 'description';
  description.scale.set(0.8, 0.8, 0.8);
  description.position.set(0, -16, zoffset);
  intro.add(description);

  //
  const headsetDescription = generateTextureCanvas('Look at the button above when you\'re ready to explore! If you need to enter or exit VR later, tap the headset button in the bottom right corner.', 18, width, 128, '', true);
  headsetDescription.name = 'headsetDescription';
  headsetDescription.scale.set(0.8, 0.8, 0.8);
  headsetDescription.position.set(0, -32, zoffset);
  headsetDescription.visible = false;
  intro.add(headsetDescription);
  //

  intro.add(generateIntroButton('Explore', 'cardboard.png', width, -140, 12, zoffset));

  //
  const ready = generateIntroButton('Ready?', 'cardboard.png', width, 130, -16, zoffset);
  ready.visible = false;
  intro.add(ready);
  //

  intro.scale.set(0.01, 0.01, 0.01);
  intro.position.set(0, stageSize / 5, 0);

  return intro;
}

export default generate;
