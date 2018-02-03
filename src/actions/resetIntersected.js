/*
  file: resetIntersected.js
  description: Resects previously intersected node objects
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function resetIntersected(intersected) {
  if (intersected.userData.type === 'node') {
    intersected.userData.nextScale = 1;
    intersected.children.forEach((c) => {
      if (c.userData.type === 'sphere') {
        c.material.dispose(); // Dispose existing geometry
        c.material = null;
        c.material = c.currentMaterial;
      }
    });
  }
  return intersected;
}

export default resetIntersected;
