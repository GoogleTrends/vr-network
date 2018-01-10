import * as THREE from 'three';

let shootingstar = null;

export function generate(container, stageSize, count) {
  const starGeometry = new THREE.SphereGeometry(0.005, 12);
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let s = 0;
  while (s < count) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(
      (Math.random() - 0.5) * stageSize * 2,
      2 + (Math.random() * (stageSize / 2)),
      (Math.random() - 0.5) * stageSize * 2,
    );
    container.add(star);
    s += 1;
  }
  return container;
}

export function update(container, stageSize, time) {
  if (shootingstar) {
    const tpos = new THREE.Vector3(
      shootingstar.position.x,
      shootingstar.position.y,
      shootingstar.position.z,
    ).lerp(shootingstar.userData.nextPos, 0.1);
    shootingstar.position.set(tpos.x, tpos.y, tpos.z);
    if (shootingstar.position.distanceTo(shootingstar.userData.nextPos) < 0.01) {
      shootingstar = null;
    }
  } else if (Math.floor(time) % 1000 === 0) {
    const index = Math.floor(Math.random() * container.children.length);
    shootingstar = container.children[index];
    shootingstar.userData.nextPos = new THREE.Vector3(
      (Math.random() - 0.5) * stageSize * 2,
      2 + (Math.random() * (stageSize / 2)),
      (Math.random() - 0.5) * stageSize * 2,
    );
  }
}
