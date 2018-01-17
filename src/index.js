/* global window, document, WebFont */

// import cloneDeep from 'lodash.clonedeep';

import { setupScene, updateSceneFromState, requestPresent, toggleVREnabled, sceneReady } from './main';
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
  width: 0,
  orientation: 'portrait',
  timer: {
    interval: null,
    count: timerduration,
  },
  sceneExists: false,
  active: true,
  vrEnabled: false,
};

function enterScene() {
  document.querySelector('#intro').classList.add('hide');
  introState.active = false;
  if (!introState.sceneExists) {
    introState.sceneExists = true;
    setupScene(data, state);
  // } else {
  //   updateSceneFromState(state);
  }
  sceneReady();
}

function startTimer() {
  const offset = 502; // radius of circle
  introState.timer.count = timerduration;
  document.querySelector('#count').textContent = introState.timer.count;
  document.querySelector('#ring').setAttribute('stroke-dashoffset', offset - ((timerduration - introState.timer.count) * (offset / (timerduration + 1))));
  introState.timer.interval = setInterval(() => {
    introState.timer.count -= 1;
    document.querySelector('#count').textContent = introState.timer.count;
    document.querySelector('#ring').setAttribute('stroke-dashoffset', offset - ((timerduration - introState.timer.count) * (offset / (timerduration + 1))));
    if (!introState.active) {
      introState.timer.count = timerduration;
      clearInterval(introState.timer.interval);
      document.querySelector('#intro').classList.add('hide');
    }
    if (introState.timer.count < 0) {
      introState.timer.count = timerduration;
      clearInterval(introState.timer.interval);
      //
      // state.vrEnabled = true;
      toggleVREnabled(true, true);
      enterScene();
    }
  }, 1000);
}

function showSlide(id) {
  if (introState.active) {
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
}

function swapSlidesOnOrientation() {
  if (introState.slide === 1 || introState.slide === 0) {
    if (introState.orientation.includes('landscape')) {
      // document.querySelector('#logo').classList.add('hide');
      showSlide(2);
    }
  } else if (introState.slide === 2) {
    if (introState.orientation.includes('portrait')) {
      // document.querySelector('#logo').classList.remove('hide');
      showSlide(1);
    }
  }
}

function updateOrientation() {
  if (introState.width !== window.innerWidth) {
    const screenOrientation = (window.innerWidth > window.innerHeight) ? 90 : 0;
    //
    let orientation = 'portrait';
    if (screenOrientation === 90) {
      orientation = 'landscape';
    }
    introState.orientation = orientation;
    introState.width = window.innerWidth;
    //
    swapSlidesOnOrientation();
  }
}

function showIntro() {
  introState.active = true;
  showSlide(0);
  document.querySelector('#intro').classList.remove('hide');
}

function setupIntro() {
  document.querySelector('#logo').src = state.logo;
  //
  // updateOrientation();
  introState.width = window.innerWidth;
  window.addEventListener('resize', updateOrientation, false);
  // window.addEventListener('orientationchange', updateOrientation, false);

  //
  document.querySelector('#intro').addEventListener('click', requestPresent, true);
  //

  //
  document.querySelector('#inbutton').addEventListener('click', showIntro, true);
  document.querySelector('#explore').addEventListener('click', () => showSlide(1), true);
  document.querySelector('#threesixty').addEventListener('click', () => {
    // state.vrEnabled = false;
    toggleVREnabled(true, false);
    enterScene();
  }, true);
  //

  /*
    TEMP FOR DEV
  */
  // document.querySelector('#slide-1').addEventListener('click', () => showSlide(2), true);
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
    active: () => {
      setupScene(data, state);
      introState.sceneExists = true;
    },
    inactive: () => {
      setupScene(data, state);
      introState.sceneExists = true;
    },
    timeout: 2000,
  });
}
