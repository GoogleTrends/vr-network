import * as THREE from 'three';
import MeshLine from '../../three_modules/THREE.MeshLine';
import { generateTextureCanvas } from '../generateTextureCanvas';
import { generateCurveGeometry } from '../generateCurveGeometry';

export function generate(state, lineMaterials, userHeight) {
  const container = new THREE.Group();

  const inLineGeometry = generateCurveGeometry(
    new THREE.Vector3(0, 0.05, -1),
    new THREE.Vector3(-1.5, 0.05, -1),
    userHeight,
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
    new THREE.Vector3(-1.5, -0.3, -1),
    new THREE.Vector3(0, -0.3, -1),
    userHeight,
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

  container.name = 'legend';
  container.position.set(-1, 0.75, -1);
  container.rotation.set((Math.PI / 180) * -45, 0, 0);

  return container;
}

export default generate;
