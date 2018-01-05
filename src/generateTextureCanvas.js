/* global document */
import * as THREE from 'three';

export function generateTextureCanvas(text, textSize, width, height, weight = '') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  context.font = `${weight}${textSize}pt Roboto Condensed`;

  const textWidth = context.measureText(text).width;
  // context.fillStyle = 'rgba(0, 0, 0, 0.2)';
  // context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgb(0, 0, 0)';
  context.lineWidth = 7;
  context.strokeText(text, (width / 2) - (textWidth / 2), (height / 2) + (textSize / 2.25));

  context.fillStyle = 'rgb(255, 255, 255)';
  context.fillText(text, (width / 2) - (textWidth / 2), (height / 2) + (textSize / 2.25));

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(width, height);

  return new THREE.Mesh(geometry, material);
}

export default generateTextureCanvas;
