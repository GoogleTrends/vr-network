/* global document */
import * as THREE from 'three';

export function generateTextureCanvas(text, textSize, width, height, weight = '', split = false, opacity = 1, fill = 'rgb(255, 255, 255)', stroke = 'rgb(0, 0, 0)') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  // context.fillStyle = 'rgba(255, 255, 255, 0.2)';
  // context.fillRect(0, 0, width, height);

  context.font = `${weight}${textSize}pt Roboto Condensed`;
  context.fillStyle = fill;

  if (split) {
    const splitText = text.split(' ');
    let thisline = '';
    let lineCount = 0;
    splitText.forEach((t) => {
      const textWidth = context.measureText(`${thisline}${t} `).width;
      if (textWidth < width) {
        thisline += `${t} `;
      } else {
        lineCount += 1;
        context.fillText(thisline, 0, lineCount * textSize * 1.5);
        thisline = `${t} `;
      }
    });
    lineCount += 1;
    context.fillText(thisline, 0, lineCount * textSize * 1.5);
  } else {
    const textWidth = context.measureText(text).width;
    context.strokeStyle = stroke;
    context.lineWidth = 6;
    context.strokeText(text, (width / 2) - (textWidth / 2), (height / 2) + (textSize / 2.25));
    context.fillStyle = fill;
    context.fillText(text, (width / 2) - (textWidth / 2), (height / 2) + (textSize / 2.25));
  }

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    opacity,
  });

  const geometry = new THREE.PlaneGeometry(width, height);

  return new THREE.Mesh(geometry, material);
}

export default generateTextureCanvas;
