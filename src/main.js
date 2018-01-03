/* global window, document, navigator, performance */

import * as THREE from 'three';
import cloneDeep from 'lodash.clonedeep';

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

import { updateLineMaterials } from './materials/lineMaterials';
import * as sphereMaterials from './materials/sphereMaterials';


const worldState = {
  vrEnabled: false,
  layoutMode: 1,
  isTransitioning: false,
};
const sceneObjects = {
  nodes: new THREE.Group(),
  links: new THREE.Group(),
  stars: new THREE.Group(),
  legend: new THREE.Group(),
  cursor: new THREE.Group(),
  buttons: new THREE.Group(),
};
const linkScale = {
  min: 0.5,
  max: 5,
};

const noSleep = new NoSleep();
const stageSize = 10;

let globalData = {};
let initData = {};
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
let lineMaterials;
let shootingstar = null;


function updateNetwork() {
  sceneObjects.nodes.children.forEach((n) => {
    const [nd] = globalData.nodes.filter(d => d.id === n.userData.id);
    if (!nd.shifted) {
      nd.lastPos = nd.pos;
    }
    //
    n.children.forEach((c) => {
      if (c.userData.type !== 'text') {
        //
        // Dispose existing geometry
        c.material.dispose();
        c.material = null;
        //
        if (nd.status === 'center') {
          c.currentMaterial = sphereMaterials.adjacent;
          c.material = sphereMaterials.highlight;
        } else if (nd.status === 'adjacent') {
          c.material = sphereMaterials.adjacent;
        } else {
          c.material = sphereMaterials.basic;
        }
      }
    });
    //
    n.userData.status = nd.status;
    n.userData.nextPos = nd.pos;
  });
  sceneObjects.links.children.forEach((l) => {
    l.userData.nextSPos = globalData.nodes.filter(n => l.userData.source === n.id)[0].pos;
    l.userData.nextTPos = globalData.nodes.filter(n => l.userData.target === n.id)[0].pos;
  });
  //
  sceneObjects.buttons.children.forEach((b) => {
    b.visible = true;
  });
  //
}

function layoutByRank() {
  const rowCount = 3;
  const perRow = Math.ceil(globalData.nodes.length / rowCount);

  globalData.nodes.sort((a, b) => parseInt(a.rank, 10) > parseInt(b.rank, 10));

  globalData.nodes = globalData.nodes.map((n, i) => {
    n.shifted = false;
    n.status = '';
    n.pos = new THREE.Vector3(
      Math.cos(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
      (controls.userHeight / (rowCount * 2)) + (i / perRow),
      Math.sin(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
    );
    return n;
  });

  globalData.links = globalData.links.map((l) => {
    l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
    l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
    return l;
  });

  initData = cloneDeep(globalData);

  updateNetwork();
}

function scaleValue(value, domain, range) {
  return (((value - domain.min) / (domain.max - domain.min)) * (range.max - range.min)) + range.min;
}

function scaleValueWithGap(value, domain, range, gap) {
  let scaledValue = value;
  const halfDomain = domain.min + ((domain.max - domain.min) / 2);
  const halfRange = range.min + ((range.max - range.min) / 2);
  if (value < halfDomain) {
    scaledValue = scaleValue(
      value,
      {
        min: domain.min,
        max: halfDomain,
      },
      {
        min: range.min,
        max: halfRange - (gap / 2),
      },
    );
  } else {
    scaledValue = scaleValue(
      value,
      {
        min: halfDomain,
        max: domain.max,
      },
      {
        min: halfRange + (gap / 2),
        max: range.max,
      },
    );
  }
  return scaledValue;
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

    const offset = new THREE.Vector3(-stageSize / 2, -controls.userHeight, -stageSize / 2);

    globalData.nodes = simulation.nodes().map((n) => {
      n.shifted = false;
      n.status = '';
      n.pos = new THREE.Vector3(
        scaleValueWithGap(
          n.x,
          dimensionMap.x,
          {
            min: 0,
            max: stageSize,
          },
          stageSize / 10,
        ),
        scaleValue(
          n.y,
          dimensionMap.y,
          {
            min: controls.userHeight * 0.75,
            max: controls.userHeight * 3.0,
          },
        ),
        scaleValueWithGap(
          n.z,
          dimensionMap.z,
          {
            min: 0,
            max: stageSize,
          },
          stageSize / 10,
        ),
      )
        .add(offset);
      return n;
    });

    globalData.links = globalData.links.map((l) => {
      l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
      l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
      return l;
    });

    initData = cloneDeep(globalData);

    updateNetwork();
  });
}

function layoutByRandom() {
  globalData.nodes = globalData.nodes.map((n) => {
    n.shifted = false;
    n.status = '';
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

  initData = cloneDeep(globalData);

  updateNetwork();
}

// function layoutNetwork() {
//   switch (worldState.layoutMode) {
//     case 0:
//       layoutByRank();
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
  enableNoSleep();
  // TODO: remove stereo from desktop when done w/ development
  worldState.vrEnabled = !worldState.vrEnabled;
  if (worldState.vrEnabled) {
    if (vrDisplay.capabilities.canPresent) {
      vrDisplay.requestPresent([{ source: document.body }]);
    }
    document.querySelector('#vrbutton').classList.add('enabled');
    document.querySelector('#centerline').classList.add('enabled');
  } else {
    if (vrDisplay.capabilities.canPresent) {
      vrDisplay.exitPresent();
    }
    document.querySelector('#vrbutton').classList.remove('enabled');
    document.querySelector('#centerline').classList.remove('enabled');
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
}

// let sample = 0;
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
    // if (sample < 2) {
    //   console.log(n);
    // }
    // sample++;
    if (Math.abs(n.scale.x - n.userData.nextScale) > 0.01) {
      const tscale = THREE.Math.lerp(n.scale.x, n.userData.nextScale, 0.1);
      // console.log(tscale);
      n.scale.set(tscale, tscale, tscale);
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
        //
        // Dispose existing geometry
        l.geometry.dispose();
        l.geometry = null;
        //
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
  if (intersected.userData.type === 'node') {
    intersected.userData.nextScale = 1;
    intersected.children.forEach((c) => {
      if (c.userData.type !== 'text') {
        //
        // Dispose existing geometry
        c.material.dispose();
        c.material = null;
        //
        c.material = c.currentMaterial;
      }
    });
  }
}

function highlightIntersected() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const nodeIntersects = raycaster.intersectObjects(sceneObjects.nodes.children, true);
  const buttonIntersects = raycaster.intersectObjects(sceneObjects.buttons.children, true);
  const intersects = [...new Set([...nodeIntersects, ...buttonIntersects])];
  //
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
        //
        if (intersected.userData.type === 'node') {
          const scaleBy = Math.ceil(intersected.position.distanceTo(camera.position) / 2);
          intersected.userData.nextScale = scaleBy;
          // intersected.scale.set(scaleBy, scaleBy, scaleBy);
        }
        //
        if (intersected.userData.status !== 'center') {
          foundCurrent = true;
        }
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
      if (intersected.userData.type === 'node') {
        sceneObjects.links.children.forEach((l) => {
          //
          // Dispose existing geometry
          l.material.dispose();
          l.material = null;
          //
          if (l.userData.source === intersected.userData.id) {
            l.material = lineMaterials.highlightOut;
            l.userData.status = 'out';
          } else if (l.userData.target === intersected.userData.id) {
            l.material = lineMaterials.highlightIn;
            l.userData.status = 'in';
          } else {
            l.material = lineMaterials.basic;
            l.userData.status = '';
          }
        });
        const scaleBy = Math.ceil(intersected.position.distanceTo(camera.position) / 2);
        intersected.userData.nextScale = scaleBy;
        // intersected.scale.set(scaleBy, scaleBy, scaleBy);
        intersected.children.forEach((c) => {
          if (c.userData.type !== 'text') {
            // c.currentMaterial = c.material;
            if (
              intersected.userData.status === 'adjacent'
              ||
              intersected.userData.status === 'center'
            ) {
              c.currentMaterial = sphereMaterials.adjacent;
            } else {
              c.currentMaterial = sphereMaterials.basic;
            }
            //
            // Dispose existing geometry
            c.material.dispose();
            c.material = null;
            //
            c.material = sphereMaterials.highlight;
          }
        });
      }
    }
    //
    if (foundCurrent && timer === null) {
      timer = 0;
    } else if (!foundCurrent && timer !== null) {
      timer = null;
      //
      // Dispose existing geometry
      sceneObjects.cursor.children[3].geometry.dispose();
      sceneObjects.cursor.children[3].geometry = null;
      //
      sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
    }
  } else {
    timer = null;
    //
    // Dispose existing geometry
    sceneObjects.cursor.children[3].geometry.dispose();
    sceneObjects.cursor.children[3].geometry = null;
    //
    sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
  }
}

function makeLinkedAdjacent(centerNode) {
  if (centerNode.type === 'node') {
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
      Math.cos(angle) * (stageSize / 3),
      centerData.pos.y + ((controls.userHeight - centerData.pos.y) / 2),
      Math.sin(angle) * (stageSize / 3),
    );

    const linkCount = linked.length;
    const phi = (Math.PI * 2) / linkCount;
    const radius = (stageSize / 10);
    const theta = angle + (90 * (Math.PI / 180));

    let i = 0;
    globalData.nodes.forEach((n) => {
      if (n.id === centerNode.id) {
        n.shifted = true;
        n.status = 'center';
      } else {
        n.shifted = false;
        n.status = '';
        n.pos = n.lastPos;
      }
      if (linked.includes(n.id)) {
        n.shifted = true;
        n.status = 'adjacent';
        const xzradius = Math.cos(i * (Math.PI / (linkCount / 2))) * radius;
        n.pos = new THREE.Vector3(
          centerData.pos.x + (Math.cos(theta) * xzradius),
          centerData.pos.y + (Math.sin(phi * i) * radius),
          centerData.pos.z + (Math.sin(theta) * xzradius),
        );
        i += 1;
      }
    });

    updateNetwork();
  } else {
    // console.log(intersected);
    sceneObjects.buttons.children.forEach((b) => {
      b.visible = false;
    });
    // intersected.visible = false;
    if (centerNode.name === 'Rank') {
      layoutByRank();
    } else if (centerNode.name === 'Simulation') {
      layoutByForce();
    } else {
      globalData = cloneDeep(initData);
    }
  }
  // updateNetwork();
}

function updateStars(time) {
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
    const index = Math.floor(Math.random() * sceneObjects.stars.children.length);
    shootingstar = sceneObjects.stars.children[index];
    shootingstar.userData.nextPos = new THREE.Vector3(
      (Math.random() - 0.5) * stageSize * 2,
      2 + (Math.random() * (stageSize / 2)),
      (Math.random() - 0.5) * stageSize * 2,
    );
  }
}

function updateCursor() {
  if (!worldState.isTransitioning) {
    highlightIntersected();
    // checkButtons();
    //
    if (timer !== null) {
      if (timer < Math.PI * 2) {
        timer += Math.PI / 30;
        //
        // Dispose existing geometry
        sceneObjects.cursor.children[3].geometry.dispose();
        sceneObjects.cursor.children[3].geometry = null;
        //
        sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(
          0.02,
          0.03,
          24,
          8,
          -timer,
          timer,
        );
      } else {
        makeLinkedAdjacent(intersected.userData);
      }
    }
  } else {
    timer = null;
    //
    // Dispose existing geometry
    sceneObjects.cursor.children[3].geometry.dispose();
    sceneObjects.cursor.children[3].geometry = null;
    //
    sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(
      0.02,
      0.03,
      24,
      8,
      0,
      0,
    );
  }
}

// Request animation frame loop function
function animate() {
  const time = performance.now() * 0.01;
  // lineMaterials.basic.uniforms.time.value = time;
  lineMaterials.highlightOut.uniforms.time.value = time;
  lineMaterials.highlightIn.uniforms.time.value = time;

  transitionElements();

  updateStars(time);

  updateCursor();

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
    node.userData.type = 'node';
    node.userData.name = d.name;
    node.userData.id = d.id;
    node.shifted = false;
    node.status = '';
    node.position.set(d.pos.x, d.pos.y, d.pos.z);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterials.basic);
    sphere.userData.type = 'sphere';
    node.add(sphere);
    const text = generateTextureCanvas(`${d.rank}: ${d.name}`, 60, 1024, 256); // 64
    text.scale.set(0.001, 0.001, 0.001);
    text.position.set(0, 0, 0.15);
    text.userData.type = 'text';
    node.add(text);
    sceneObjects.nodes.add(node);
  });
  scene.add(sceneObjects.nodes);

  setupStage();

  updateNetwork();

  // layoutByForce();
  layoutByRank();
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

function generateStars() {
  const starGeometry = new THREE.SphereGeometry(0.005, 12);
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let s = 0;
  while (s < 1000) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(
      (Math.random() - 0.5) * stageSize * 2,
      2 + (Math.random() * (stageSize / 2)),
      (Math.random() - 0.5) * stageSize * 2,
    );
    sceneObjects.stars.add(star);
    s += 1;
  }
  return sceneObjects.stars;
}

function generateLegend(state) {
  const inLineGeometry = generateCurveGeometry(
    new THREE.Vector3(-0.5, 0, -1.05),
    new THREE.Vector3(0.5, 0, -1.05),
    controls.userHeight,
  );
  const inLine = new MeshLine();
  inLine.setGeometry(inLineGeometry);
  const inLineMesh = new THREE.Mesh(inLine.geometry, lineMaterials.highlightIn);
  inLineMesh.userData.type = 'in';
  sceneObjects.legend.add(inLineMesh);

  const inText = generateTextureCanvas(state.legendInboundLabel, 36, 1024, 256); // 64
  inText.scale.set(0.001, 0.001, 0.001);
  inText.position.set(0, 0, -1.1);
  inText.rotation.set((Math.PI / 180) * -45, 0, 0);
  sceneObjects.legend.add(inText);

  const outLineGeometry = generateCurveGeometry(
    new THREE.Vector3(0.5, 0, -0.9),
    new THREE.Vector3(-0.5, 0, -0.9),
    controls.userHeight,
  );
  const outLine = new MeshLine();
  outLine.setGeometry(outLineGeometry);
  const outLineMesh = new THREE.Mesh(outLine.geometry, lineMaterials.highlightOut);
  outLineMesh.userData.type = 'out';
  sceneObjects.legend.add(outLineMesh);

  const outText = generateTextureCanvas(state.legendOutboundLabel, 36, 1024, 256); // 64
  outText.scale.set(0.001, 0.001, 0.001);
  outText.position.set(0, 0, -0.95);
  outText.rotation.set((Math.PI / 180) * -45, 0, 0);
  sceneObjects.legend.add(outText);

  const buttonLabel = generateTextureCanvas('Layout By', 36, 1024, 256); // 64
  buttonLabel.scale.set(0.001, 0.001, 0.001);
  buttonLabel.position.set(0, 0, -0.8);
  buttonLabel.rotation.set((Math.PI / 180) * -45, 0, 0);
  sceneObjects.legend.add(buttonLabel);

  sceneObjects.legend.name = 'legend';

  return sceneObjects.legend;
}

function generateCursor(state) {
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
  sceneObjects.cursor.add(basicCursor);

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
  sceneObjects.cursor.add(innerCursor);

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
  sceneObjects.cursor.add(outerCursor);

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
  sceneObjects.cursor.add(highlightCursor);

  sceneObjects.cursor.position.z = -1;
  sceneObjects.cursor.name = 'cursor';
  return sceneObjects.cursor;
}

function generateButton(name, color, xoffset) {
  const button = new THREE.Group();
  button.userData.name = name;
  button.userData.type = 'button';
  button.scale.set(0.001, 0.001, 0.001);
  button.position.set(xoffset, 0, -0.65);
  button.rotation.set((Math.PI / 180) * -45, 0, 0);
  const text = generateTextureCanvas(name, 36, 256, 256); // 64
  text.userData.type = 'text';
  button.add(text);
  const circle = new THREE.Mesh(
    new THREE.CircleGeometry(125, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }),
  );
  circle.userData.type = 'button';
  button.add(circle);
  return button;
}

function generateButtons() {
  sceneObjects.buttons.add(generateButton('Rank', 0x3333aa, -0.20));
  sceneObjects.buttons.add(generateButton('Simulation', 0x33aa33, 0.20));
  return sceneObjects.buttons;
}

export function setupScene(data, state) {
  globalData = data;
  flourishState = state;
  lineMaterials = updateLineMaterials(state);

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

  const ctx = renderer.context;
  ctx.getShaderInfoLog = () => ''; // Quiet shader complaint log: GL_ARB_gpu_shader5

  // Generate Non-network Scene Elements
  scene.add(generateHorizon(
    flourishState.horizonTopColor,
    flourishState.horizonBottomColor,
    flourishState.horizonExponent,
  ));
  scene.add(generateFloor(stageSize, controls.userHeight));
  scene.add(generateStars());
  scene.add(generateLegend(state));
  //

  //
  scene.add(generateButtons());
  //

  camera.add(generateCursor(state));
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
  //
  scene.remove(scene.getObjectByName('cursor', true));
  sceneObjects.cursor = new THREE.Group();
  camera.add(generateCursor(state));
  //
  lineMaterials = updateLineMaterials(flourishState);
  //
  scene.remove(scene.getObjectByName('legend', true));
  sceneObjects.legend = new THREE.Group();
  scene.add(generateLegend(state));
  //
  sceneObjects.links.children.forEach((l) => {
    if (l.userData.status === 'out') {
      l.material = lineMaterials.highlightOut;
    } else if (l.userData.status === 'in') {
      l.material = lineMaterials.highlightIn;
    } else {
      l.material = lineMaterials.basic;
    }
  });
  //
  scene.remove(scene.getObjectByName('horizon', true));
  scene.add(generateHorizon(
    flourishState.horizonTopColor,
    flourishState.horizonBottomColor,
    flourishState.horizonExponent,
  ));
}

export default setupScene;
