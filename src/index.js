/* global WebFont */

import { setupScene, updateSceneFromState } from './main';

export const data = {};

// The current state of template. You can make some or all of the properties
// of the state object available to the user as settings in settings.js.
export const state = {
  horizonTopColor: '#000000',
  horizonBottomColor: '#11203B',
  horizonExponent: 0.5,
  linkUnselectedColor: '#ffffff',
  linkUnselectedOpacity: 0.01,
  linkInboundColor: '#FDD835',
  linkOutboundColor: '#F44336',
  legendInboundLabel: 'Also Searched For',
  legendOutboundLabel: 'Related Searches',
  cursorInnerColor: '#ffffff',
  cursorOuterColor: '#000000',
  cursorActiveColor: '#0FA200',
  cursorOpacity: 0.5,
};

// The update function is called whenever the user changes a data table or settings
// in the visualisation editor, or when changing slides in the story editor.
// Tip: to make your template work nicely in the story editor, ensure that all user
// interface controls such as buttons and sliders update the state and then call update.
export function update() {
  updateSceneFromState(state);
}

// The draw function is called when the template first loads
export function draw() {
  // setupScene(data, state);
  WebFont.load({
    google: {
      families: ['Roboto Condensed:300,400,700'],
    },
    active: () => {
      setupScene(data, state);
    },
    inactive: () => {
      setupScene(data, state);
    },
    timeout: 2000,
  });
}
