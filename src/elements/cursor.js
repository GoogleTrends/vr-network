import * as THREE from 'three';

export function generate(state) {
  const container = new THREE.Group();

  const basicCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.02, 0.03, 24),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.cursorInnerColor),
      opacity: state.cursorOpacity,
      transparent: true,
      depthTest: false,
    }),
  );
  basicCursor.name = 'inner';
  container.add(basicCursor);

  const innerCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.018, 0.02, 24),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.cursorOuterColor),
      opacity: state.cursorOpacity,
      transparent: true,
      depthTest: false,
    }),
  );
  innerCursor.name = 'outer';
  container.add(innerCursor);

  const outerCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.032, 24),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.cursorOuterColor),
      opacity: state.cursorOpacity,
      transparent: true,
      depthTest: false,
    }),
  );
  outerCursor.name = 'outer';
  container.add(outerCursor);

  const highlightCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.cursorActiveColor),
      opacity: 1.0,
      transparent: true,
      depthTest: false,
    }),
  );
  highlightCursor.name = 'active';
  container.add(highlightCursor);

  container.position.z = -1;
  container.name = 'cursor';
  return container;
}

export default generate;
