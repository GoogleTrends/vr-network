/* global document */

import * as THREE from 'three';

export function generateFloor(state, stageSize, userHeight) {
  const floor = new THREE.Group();

  // const textureLoader = new THREE.TextureLoader();
  // const texture = textureLoader.load(`${Flourish.static_prefix}/GoogleTrendsLogo.svg`);
  // console.log(state.logo);
  // const texture = textureLoader.load(state.logo);
  // const image = new Image(200, 200);
  const image = document.createElement('img');
  const texture = new THREE.Texture(image);
  image.onload = () => { texture.needsUpdate = true; };
  image.src = state.logo;

  const geometry = new THREE.PlaneGeometry(512, 128);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    map: texture,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.position.set(12, 0, 0);
  floor.add(mesh);

  const width = 1024;
  const height = 512;
  const textSize = 36;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  context.clearRect(0, 0, width, height);
  // context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  // context.fillRect(0, 0, width, height);
  context.font = `${textSize}pt Roboto Condensed`;
  context.fillStyle = 'rgb(255, 255, 255)';

  const descriptiveText = state.description.split(' ');
  let thisLine = '';
  let lineCount = 0.5;
  descriptiveText.forEach((t) => {
    const textWidth = context.measureText(`${thisLine}${t} `).width;
    if (textWidth < (width - textSize)) {
      thisLine += `${t} `;
    } else {
      lineCount += 1;
      context.fillText(thisLine, (textSize / 2), lineCount * textSize * 1.5);
      thisLine = `${t} `;
    }
  });
  lineCount += 1;
  context.fillText(thisLine, (textSize / 2), lineCount * textSize * 1.5);

  const textTexture = new THREE.Texture(canvas);
  textTexture.needsUpdate = true;
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const textGeometry = new THREE.PlaneGeometry(width, height);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(0, -height / 3, 0);
  textMesh.scale.set(0.5, 0.5, 0.5);

  floor.add(textMesh);

  floor.scale.set(0.25 / 12, 0.25 / 12, 0.25 / 12);
  // floor.position.set(0, -userHeight * 4.5, -stageSize * 1.25);
  floor.position.set(0, -userHeight * 4.5, -stageSize * 1.35);
  floor.rotation.set((Math.PI / 180) * -45, 0, 0);

  return floor;
}

export default generateFloor;
