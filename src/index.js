/* global window, document, WebFont */

import { setupScene, updateSceneFromState } from './main';
import { logoURI } from './logo';

export const data = {};

// The current state of template. You can make some or all of the properties
// of the state object available to the user as settings in settings.js.
export const state = {
  logo: logoURI,
  title: 'Related Searches between Top 50 TV Shows 2017',
  description: 'Look at each Node to see the seach interest relationships between the Top 50 Seached TV Shows',
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

const timerduration = 5;
const introState = {
  slide: 0,
  slides: [0, 1, 2],
  orientation: 'portrait-primary',
  timer: {
    interval: null,
    count: timerduration,
  },
  sceneExists: false,
};

function startTimer() {
  // timer = setInterval
  const offset = 502; // radius of circle
  introState.timer.interval = setInterval(() => {
    introState.timer.count -= 1;
    document.querySelector('#count').textContent = introState.timer.count;
    document.querySelector('#ring').setAttribute('stroke-dashoffset', offset - ((timerduration - introState.timer.count) * (offset / timerduration)));
    // 502
    if (introState.timer.count < 1) {
      clearInterval(introState.timer.interval);
      document.querySelector('#intro').classList.add('hide');
      if (!introState.sceneExists) {
        setupScene(data, state);
        introState.sceneExists = true;
      }
    }
  }, 1000);
}

function showSlide(id) {
  introState.slide = id;
  introState.slides.forEach((s) => {
    if (s === id) {
      document.querySelector(`#slide-${s}`).classList.remove('hide');
    } else {
      document.querySelector(`#slide-${s}`).classList.add('hide');
    }
  });
  if (id === 2) {
    startTimer();
  } else if (introState.timer.interval) {
    clearInterval(introState.timer.interval);
  }
}

function swapSlidesOnOrientation() {
  if (introState.slide === 1 || introState.slide === 0) {
    if (introState.orientation.includes('landscape')) {
      document.querySelector('#logo').classList.add('hide');
      document.querySelector('#card').classList.add('horizontal');
      showSlide(2);
    }
  } else if (introState.slide === 2) {
    if (introState.orientation.includes('portrait')) {
      document.querySelector('#logo').classList.remove('hide');
      document.querySelector('#card').classList.remove('horizontal');
      showSlide(1);
    }
  }
}

function updateOrientation() {
  let orientation = 'portrait-primary';
  if (window.screen.orientation) {
    orientation = window.screen.orientation.type;
  } else if (window.screen.mozOrientation) {
    orientation = window.screen.mozOrientation.type;
  }
  introState.orientation = orientation;
  console.log(introState.orientation);
  //
  swapSlidesOnOrientation();
}

function setupIntro() {
  document.querySelector('#logo').src = state.logo;
  //
  // updateOrientation();
  window.addEventListener('orientationchange', updateOrientation, false);
  //
  document.querySelector('#explore').addEventListener('click', () => showSlide(1), true);
  document.querySelector('#threesixty').addEventListener('click', () => {
    document.querySelector('#intro').classList.add('hide');
    setupScene(data, state);
    introState.sceneExists = true;
  }, true);
  //

  /*
    TEMP FOR DEV
  */
  document.querySelector('#slide-1').addEventListener('click', () => {
    document.querySelector('#logo').classList.add('hide');
    document.querySelector('#card').classList.add('horizontal');
    showSlide(2);
  }, true);
  /*
    TEMP FOR DEV
  */
}

// The update function is called whenever the user changes a data table or settings
// in the visualisation editor, or when changing slides in the story editor.
// Tip: to make your template work nicely in the story editor, ensure that all user
// interface controls such as buttons and sliders update the state and then call update.
export function update() {
  setupIntro(state);
  if (introState.sceneExists) {
    updateSceneFromState(state);
  }
}

// The draw function is called when the template first loads
export function draw() {
  setupIntro(state);
  // setupScene(data, state);
  WebFont.load({
    google: {
      families: ['Roboto Condensed:300,400,700'],
    },
    // active: () => {
    //   // setupScene(data, state);
    // },
    // inactive: () => {
    //   // setupScene(data, state);
    // },
    // timeout: 2000,
  });
}
