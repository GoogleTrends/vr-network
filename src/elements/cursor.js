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

  [
    { x: 0.0, y: 0.045, w: 0.0025, h: 0.01 },
    { x: 0.045, y: 0.0, w: 0.01, h: 0.0025 },
    { x: 0.0, y: -0.045, w: 0.0025, h: 0.01 },
    { x: -0.045, y: 0.0, w: 0.01, h: 0.0025 },
  ].forEach((t) => {
    const tick = new THREE.Mesh(
      new THREE.PlaneGeometry(t.w, t.h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(state.cursorInnerColor),
        transparent: false,
        depthTest: false,
      }),
    );
    tick.position.set(t.x, t.y, 0);
    tick.name = 'tick';
    container.add(tick);
  });

  container.position.z = -1;
  container.name = 'cursor';
  return container;
}

export default generate;
