/*
  file: setActiveButton.js
  description: Sets given button to active state
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function setActiveButton(buttons, button) {
  buttons.children.forEach((b) => {
    if (b.userData.name === button) {
      b.children.filter(c => c.userData.type === 'button').forEach((c) => {
        c.material.opacity = 0.2;
      });
    } else {
      b.children.filter(c => c.userData.type === 'button').forEach((c) => {
        c.material.opacity = 0.1;
      });
    }
  });
  return buttons;
}

export default setActiveButton;
