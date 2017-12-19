/* global window, document, navigator, performance */

import * as THREE from 'three';
import MeshLine from '../three_modules/THREE.MeshLine';
import StereoEffect from '../three_modules/StereoEffect';
import VRControls from '../three_modules/VRControls';

import d3Force from '../node_modules/d3-force-3d/build/d3-force-3d.min';
import NoSleep from '../node_modules/nosleep.js/dist/NoSleep';
import '../node_modules/webvr-polyfill/build/webvr-polyfill.min';

import { generateTextureCanvas } from './generateTextureCanvas';
import { generateCurveGeometry } from './generateCurveGeometry';
import { generateHorizon } from './generateHorizon';
import { generateFloor } from './generateFloor';

import * as sphereMaterials from './materials/sphereMaterials';
import * as lineMaterials from './materials/lineMaterials';

const worldState = {
  vrEnabled: false,
  layoutMode: 1,
  isTransitioning: false,
};
const sceneObjects = {
  nodes: new THREE.Group(),
  links: new THREE.Group(),
};
const linkScale = {
  min: 0.5,
  max: 5,
};

const cursor = new THREE.Group();
const noSleep = new NoSleep();
const stageSize = 10;

let globalData = {};
let flourishState = {};
let timer = null;

let vrDisplay;
let scene;
let controls;
let effect;
let camera;
let renderer;
let raycaster;
let intersected;

// const worldState = {
//   vrEnabled: false,
//   layoutMode: 1,
//   isTransitioning: false,
// };

// function layoutByColumns() {
//   const perRow = 10;

//   // globalData.nodes.sort((a, b) => a.linkCount < b.linkCount);
//   globalData.nodes.sort((a, b) => a.rank > b.rank);

//   globalData.nodes = globalData.nodes.map((n, i) => {
//   n.shifted = false;
//     n.pos = new THREE.Vector3(
//       Math.cos(((Math.PI * 2) / perRow) * i) * (stageSize / 2),
//       (controls.userHeight / 2) + Math.floor(i / perRow),
//       Math.sin(((Math.PI * 2) / perRow) * i) * (stageSize / 2),
//     );
//     return n;
//   });

//   globalData.links = globalData.links.map((l) => {
//     l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
//     l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
//     return l;
//   });
// }

function updateNetwork() {
  sceneObjects.nodes.children.forEach((n) => {
    const [nd] = globalData.nodes.filter(d => d.id === n.userData.id);
    if (!nd.shifted) {
      nd.lastPos = nd.pos;
    }
    n.userData.nextPos = nd.pos;
  });
  sceneObjects.links.children.forEach((l) => {
    l.userData.nextSPos = globalData.nodes.filter(n => l.userData.source === n.id)[0].pos;
    l.userData.nextTPos = globalData.nodes.filter(n => l.userData.target === n.id)[0].pos;
  });
}

function scaleValue(value, domain, range) {
  return (((value - domain.min) * range.max) / domain.max) + range.min;
}

function layoutByForce() {
  const simulation = d3Force.forceSimulation()
    .numDimensions(3)
    .nodes(globalData.nodes)
    .force('link', d3Force.forceLink().id(d => d.id).links(globalData.links))
    // .force('charge', d3Force.forceManyBody().strength(-10)) // 1, -1,
    // .force('charge', d3Force.forceManyBody().strength(d => d.linkCount)) // 1, -1,
    .force('charge', d3Force.forceManyBody().strength(-1)) // 1, -1,
    .force('center', d3Force.forceCenter());

  simulation.on('end', () => {
    const dimensionMap = {};
    ['x', 'y', 'z'].forEach((d) => {
      const values = simulation.nodes().map(n => n[d]);
      dimensionMap[d] = {
        min: Math.min.apply(null, values),
        max: Math.max.apply(null, values),
      };
    });

    const offset = new THREE.Vector3(-stageSize, -controls.userHeight, -stageSize);
    globalData.nodes = simulation.nodes().map((n) => {
      n.shifted = false;
      n.pos = new THREE.Vector3(
        scaleValue(n.x, dimensionMap.x, { min: 0, max: stageSize }),
        scaleValue(n.y, dimensionMap.y, { min: 0, max: controls.userHeight * 2.5 }),
        scaleValue(n.z, dimensionMap.z, { min: 0, max: stageSize }),
      )
        .add(offset);
      return n;
    });

    globalData.links = globalData.links.map((l) => {
      l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
      l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
      return l;
    });

    updateNetwork();
  });
}

function layoutByRandom() {
  globalData.nodes = globalData.nodes.map((n) => {
    n.shifted = false;
    n.pos = new THREE.Vector3(
      (0.5 - Math.random()) * (stageSize),
      (controls.userHeight / 2) + (Math.random() * controls.userHeight),
      (0.5 - Math.random()) * (stageSize),
    );
    return n;
  });
  globalData.links = globalData.links.map((l) => {
    l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
    l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
    return l;
  });
}

// function layoutNetwork() {
//   switch (worldState.layoutMode) {
//     case 0:
//       layoutByColumns();
//       updateNetwork();
//       break;
//     case 1:
//       layoutByForce();
//       break;
//     default:
//       layoutByRandom();
//       updateNetwork();
//       break;
//   }
// }

// worldState.reset = () => {
//   worldState.layoutMode = 1;
//   layoutNetwork();
// };

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
}

function enableNoSleep() {
  noSleep.enable();
  window.removeEventListener('touchstart', enableNoSleep, true);
}

function toggleVREnabled() {
  worldState.vrEnabled = !worldState.vrEnabled;
  if (worldState.vrEnabled) {
    document.querySelector('#vrbutton').classList.add('enabled');
  } else {
    document.querySelector('#vrbutton').classList.remove('enabled');
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
}

function transitionElements() {
  let countTransitioning = 0;
  sceneObjects.nodes.children.forEach((n) => {
    if (n.position.distanceTo(n.userData.nextPos) > 0.01) {
      const tpos = new THREE.Vector3(
        n.position.x,
        n.position.y,
        n.position.z,
      ).lerp(n.userData.nextPos, 0.1);
      n.position.set(tpos.x, tpos.y, tpos.z);
      countTransitioning += 1;
    }
    n.quaternion.copy(camera.quaternion);
  });
  if (countTransitioning > 0) {
    worldState.isTransitioning = true;
  } else {
    worldState.isTransitioning = false;
  }
  if (worldState.isTransitioning) {
    sceneObjects.links.children.forEach((l) => {
      l.material.visible = false;
    });
  } else {
    sceneObjects.links.children.forEach((l) => {
      l.material.visible = true;
      if (
        (l.userData.spos.distanceTo(l.userData.nextSPos) > 0.01)
        ||
        (l.userData.tpos.distanceTo(l.userData.nextTPos) > 0.01)
      ) {
        l.material.visible = true;
        l.userData.spos = new THREE.Vector3(
          l.userData.nextSPos.x,
          l.userData.nextSPos.y,
          l.userData.nextSPos.z,
        );
        l.userData.tpos = new THREE.Vector3(
          l.userData.nextTPos.x,
          l.userData.nextTPos.y,
          l.userData.nextTPos.z,
        );
        const lineGeometry = generateCurveGeometry(
          l.userData.spos,
          l.userData.tpos,
          controls.userHeight,
        );
        const line = new MeshLine();
        line.setGeometry(
          lineGeometry,
          () => scaleValue(l.userData.value, { min: 1, max: 100 }, linkScale),
        );
        const lineMesh = new THREE.Mesh(line.geometry, lineMaterials.basic);
        l.geometry = lineMesh.geometry;
        l.geometry.attributes.position.needsUpdate = true;
      }
    });
  }
}

function resetIntersected() {
  intersected.scale.set(1, 1, 1);
  intersected.children.forEach((c) => {
    if (c.userData.type !== 'text') {
      c.material = c.currentMaterial;
    }
  });
}

function highlightIntersected() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersects = raycaster.intersectObjects(sceneObjects.nodes.children, true);
  if (intersects.length > 0) {
    let searching = true;
    let index = 0;
    let nextIntersected = null;
    //
    let foundCurrent = false;
    intersects.forEach((o) => {
      if (
        o.object.parent === intersected
        &&
        o.object.userData.type !== 'text'
      ) {
        foundCurrent = true;
      }
    });
    //
    while (searching) {
      if (
        intersects[index].object.parent !== intersected
        &&
        (
          intersects[index].distance > (stageSize / 2)
            ||
          intersects[index].object.userData.type !== 'text'
        )
      ) {
        nextIntersected = intersects[index].object;
        searching = false;
      }
      index += 1;
      if (index > intersects.length - 1) {
        searching = false;
      }
    }
    //
    if (nextIntersected !== null) {
      if (intersected) {
        resetIntersected();
      }
      timer = 0;
      intersected = nextIntersected.parent;
      sceneObjects.links.children.forEach((l) => {
        if (l.userData.source === intersected.userData.id) {
          l.material = lineMaterials.highlightOut;
        } else if (l.userData.target === intersected.userData.id) {
          l.material = lineMaterials.highlightIn;
        } else {
          l.material = lineMaterials.basic;
        }
      });
      const scaleBy = Math.ceil(intersected.position.distanceTo(camera.position) / 2);
      intersected.scale.set(scaleBy, scaleBy, scaleBy);
      intersected.children.forEach((c) => {
        if (c.userData.type !== 'text') {
          c.currentMaterial = c.material;
          c.material = sphereMaterials.highlight;
        }
      });
    }
    //
    if (foundCurrent && timer === null) {
      timer = 0;
    } else if (!foundCurrent && timer !== null) {
      timer = null;
      cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
    }
  } else {
    timer = null;
    cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
  }
}

function makeLinkedAdjacent(centerNode) {
  const sourceLinks = globalData.links
    .filter(l => (l.sourceId === centerNode.id))
    .map(l => l.targetId);
  const targetLinks = globalData.links
    .filter(l => (l.targetId === centerNode.id))
    .map(l => l.sourceId);
  const linked = [...new Set([...sourceLinks, ...targetLinks])];

  const [centerData] = globalData.nodes.filter(n => n.id === centerNode.id);
  const angle = Math.atan2(centerData.pos.z, centerData.pos.x);
  centerData.pos = new THREE.Vector3(
    Math.cos(angle) * (stageSize / 4),
    centerData.pos.y + ((controls.userHeight - centerData.pos.y) / 2),
    Math.sin(angle) * (stageSize / 4),
  );

  const linkCount = Math.max(1, (linked.length - 1));
  const phi = (Math.PI * 2) / linkCount;
  const radius = (stageSize / 10) + (linkCount / 9);
  const theta = angle + (90 * (Math.PI / 180));

  let i = 0;
  globalData.nodes.forEach((n) => {
    if (n.id === centerNode.id) {
      n.shifted = true;
    } else {
      n.shifted = false;
      n.pos = n.lastPos;
    }
    if (linked.includes(n.id)) {
      n.shifted = true;
      const xzradius = ((i - (linkCount / 2)) * ((radius * 2) / linkCount));
      n.pos = new THREE.Vector3(
        centerData.pos.x + (Math.cos(theta) * xzradius),
        centerData.pos.y + (Math.sin(phi * (i / 2)) * radius),
        centerData.pos.z + (Math.sin(theta) * xzradius),
      );
      i += 1;
    }
  });

  updateNetwork();
}

// camera.rotation.onRotationChange((r) => {
//   console.log(r);
// });

// Request animation frame loop function
function animate() {
  const time = performance.now() * 0.01;
  lineMaterials.basic.uniforms.time.value = time;
  lineMaterials.highlightOut.uniforms.time.value = time;
  lineMaterials.highlightIn.uniforms.time.value = time;

  transitionElements();

  // console.log(camera.rotation.y * (180 / Math.PI));

  if (!worldState.isTransitioning) {
    highlightIntersected();
    //
    if (timer !== null) {
      if (timer < Math.PI * 2) {
        timer += Math.PI / 60;
        cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, -timer, timer);
      } else {
        makeLinkedAdjacent(intersected.userData);
      }
    }
  } else {
    timer = null;
    cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
  }

  // if (vrButton.isPresenting()) { // } // Only update controls if we're presenting.
  controls.update();

  if (worldState.vrEnabled) {
    effect.render(scene, camera); // Render the scene.
  } else {
    renderer.render(scene, camera);
  }

  vrDisplay.requestAnimationFrame(animate);
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage() {
  navigator.getVRDisplays().then((displays) => {
    if (displays.length > 0) {
      [vrDisplay] = displays;
      // if (vrDisplay.stageParameters) {
      //   // TODO: Handle Stage Updates
      //   setStageDimensions(vrDisplay.stageParameters);
      // }
      vrDisplay.requestAnimationFrame(animate);
    }
  });
}

function drawNetwork() {
  layoutByRandom();

  globalData.links.forEach((l) => {
    const lineGeometry = generateCurveGeometry(l.spos, l.tpos, controls.userHeight);
    const line = new MeshLine();
    line.setGeometry(
      lineGeometry,
      () => scaleValue(l.value, { min: 1, max: 100 }, linkScale),
    );
    const lineMesh = new THREE.Mesh(line.geometry, lineMaterials.basic);
    lineMesh.userData.source = l.source;
    lineMesh.userData.spos = l.spos;
    lineMesh.userData.target = l.target;
    lineMesh.userData.tpos = l.tpos;
    lineMesh.userData.value = l.value;
    sceneObjects.links.add(lineMesh);
  });
  scene.add(sceneObjects.links);

  const sphereGeometry = new THREE.SphereGeometry(0.1, 18, 18);
  globalData.nodes.forEach((d) => {
    const node = new THREE.Group();
    node.userData.name = d.name;
    node.userData.id = d.id;
    node.shifted = false;
    node.position.set(d.pos.x, d.pos.y, d.pos.z);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterials.basic);
    sphere.userData.type = 'sphere';
    node.add(sphere);
    const text = generateTextureCanvas(`${d.rank}: ${d.name}`, 64, 1024, 256);
    text.scale.set(0.001, 0.001, 0.001);
    text.position.set(0, 0, 0.15);
    text.userData.type = 'text';
    node.add(text);
    sceneObjects.nodes.add(node);
  });
  scene.add(sceneObjects.nodes);

  setupStage();

  updateNetwork();

  layoutByForce();
}

function formatData() {
  globalData.links = globalData.links.map((l) => {
    l.sourceId = l.source;
    l.targetId = l.target;
    return l;
  });
  globalData.nodes = globalData.nodes.map((n) => {
    n.linkCount = globalData.links.filter(l => (l.sourceId === n.id || l.targetId === n.id)).length;
    return n;
  });
  globalData.nodes = globalData.nodes.filter(n => n.linkCount);
  drawNetwork();
}

// function formatState(state) {
//   state.forEach((s) => {
//     console.log(s);
//   });
// }

export function setupScene(data, state) {
  globalData = data;
  flourishState = state;

  // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene(); // Create a three.js scene.

  // Create a three.js camera.
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 10000);
  controls = new VRControls(camera);
  controls.standing = true;
  camera.position.y = controls.userHeight;

  const ctx = renderer.context; // Quiet shader complaint log: GL_ARB_gpu_shader5
  ctx.getShaderInfoLog = () => '';

  scene.add(generateHorizon(
    flourishState.horizonTopColor,
    flourishState.horizonBottomColor,
    flourishState.horizonExponent,
  ));
  scene.add(generateFloor(stageSize, controls.userHeight));

  const basicCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.02, 0.03, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    }),
  );
  const innerCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.018, 0.02, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.5,
      transparent: true,
    }),
  );
  const outerCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.032, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.5,
      transparent: true,
    }),
  );
  const highlightCursor = new THREE.Mesh(
    new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0),
    new THREE.MeshBasicMaterial({
      color: 0xff7700,
      opacity: 1.0,
      transparent: true,
    }),
  );
  cursor.add(basicCursor);
  cursor.add(innerCursor);
  cursor.add(outerCursor);
  cursor.add(highlightCursor);
  cursor.position.z = -1;

  camera.add(cursor);
  scene.add(camera);

  raycaster = new THREE.Raycaster();

  // Apply VR stereo rendering to renderer.
  effect = new StereoEffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  // Event Listeners
  window.addEventListener('resize', onResize, true);
  window.addEventListener('vrdisplaypresentchange', onResize, true);
  window.addEventListener('touchstart', enableNoSleep, true);

  document.querySelector('#vrbutton').addEventListener('click', toggleVREnabled, true);

  formatData();
}

export function updateSceneFromState(state) {
  flourishState = state;

  scene.remove(scene.getObjectByName('horizon', true));
  scene.add(generateHorizon(
    flourishState.horizonTopColor,
    flourishState.horizonBottomColor,
    flourishState.horizonExponent,
  ));
}

export default setupScene;
