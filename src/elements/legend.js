/* global document, Flourish */

import * as THREE from 'three';
import MeshLine from '../../three_modules/THREE.MeshLine';
import { generateTextureCanvas } from '../generateTextureCanvas';
import { generateCurveGeometry } from '../generateCurveGeometry';

const textureLoader = new THREE.TextureLoader();
const imgGeometry = new THREE.PlaneGeometry(256, 256);

export function generate(state, lineMaterials, userHeight) {
  const container = new THREE.Group();

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
  mesh.scale.set(0.001, 0.001, 0.001);
  mesh.position.set(0, 0.25, 0);
  container.add(mesh);

  const inLineGeometry = generateCurveGeometry(
    new THREE.Vector3(-0.3, 0.0, 0.0),
    new THREE.Vector3(0.3, 0.0, 0.0),
    userHeight / 2,
  );
  const inLine = new MeshLine();
  inLine.setGeometry(inLineGeometry);
  const inLineMesh = new THREE.Mesh(inLine.geometry, lineMaterials.highlightIn);
  inLineMesh.userData.type = 'in';
  container.add(inLineMesh);

  const inText = generateTextureCanvas(state.legendInboundLabel, 36, 1024, 256); // 64
  inText.scale.set(0.001, 0.001, 0.001);
  inText.position.set(0.025, 0, 0);
  container.add(inText);

  const outLineGeometry = generateCurveGeometry(
    new THREE.Vector3(0.3, -0.2, 0.0),
    new THREE.Vector3(-0.3, -0.2, 0.0),
    userHeight / 2,
  );
  const outLine = new MeshLine();
  outLine.setGeometry(outLineGeometry);
  const outLineMesh = new THREE.Mesh(outLine.geometry, lineMaterials.highlightOut);
  outLineMesh.userData.type = 'out';
  container.add(outLineMesh);

  const outText = generateTextureCanvas(state.legendOutboundLabel, 36, 1024, 256); // 64
  outText.scale.set(0.001, 0.001, 0.001);
  outText.position.set(0.025, -0.2, 0);
  container.add(outText);

  const infoMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/info.png`),
    transparent: true,
    depthTest: false,
  });
  const info = new THREE.Mesh(imgGeometry, infoMaterial);
  info.name = 'info';
  info.userData.type = 'button';
  info.scale.set(0.0005, 0.0005, 0.0005);
  info.position.set(0, -0.35, 0);
  container.add(info);

  const made = generateTextureCanvas('Made by Pitch Interactive', 36, 512, 128);
  made.scale.set(0.001, 0.001, 0.001);
  made.position.set(0.45, -0.5, 0);
  container.add(made);

  container.name = 'legend';
  container.userData.name = 'info';
  container.userData.type = 'button';
  container.position.set(-0.45, 0.6, -0.8);
  container.rotation.set((Math.PI / 180) * -45, 0, 0);

  return container;
}

export default generate;
