/*
  file: resetLinks.js
  description: Reset highlight state of links
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function resetLinks(links, basicMaterial) {
  return links.children.forEach((l) => {
    l.material.dispose(); // Dispose existing geometry
    l.material = null;
    l.material = basicMaterial;
    l.material.visible = false;
    l.userData.status = '';
  });
}

export default resetLinks;
