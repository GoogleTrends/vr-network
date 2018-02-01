/* global window, document, navigator, performance, Flourish */

import * as THREE from 'three';
import cloneDeep from 'lodash.clonedeep';
import TWEEN from '@tweenjs/tween.js';
import MeshLine from '../three_modules/THREE.MeshLine';
import StereoEffect from '../three_modules/StereoEffect';
import VRControls from '../three_modules/VRControls';
import d3Force from '../node_modules/d3-force-3d/build/d3-force-3d.min';
import NoSleep from '../node_modules/nosleep.js/dist/NoSleep';
import '../node_modules/webvr-polyfill/build/webvr-polyfill.min';

import { sendEvent } from './analytics';
import { generateTextureCanvas } from './generateTextureCanvas';
import { generateCurveGeometry } from './generateCurveGeometry';
import { generateHorizon, updateHorizonVisibility } from './elements/horizon';
import { generateButtons } from './elements/buttons';
import { updateLineMaterials } from './materials/lineMaterials';
import { updateSphereMaterials, updateSphereOpacity } from './materials/sphereMaterials';
import * as legend from './elements/legend';
import * as cursor from './elements/cursor';
import * as stars from './elements/stars';
import * as intro from './elements/intro';
import * as scaleValue from './scaleValue';

const worldState = {
  intro: {
    active: true,
    updating: true,
    zooming: false,
    returning: false,
  },
  vrEnabled: false,
  isTransitioning: false,
  labelsNeedUpdate: true,
};
const sceneObjects = {
  user: new THREE.Group(),
  intro: new THREE.Group(),
  nodes: new THREE.Group(),
  links: new THREE.Group(),
  stars: new THREE.Group(),
  cursor: new THREE.Group(),
  lookup: new THREE.Group(),
  buttons: new THREE.Group(),
};
const linkScale = {
  min: 1,
  max: 3,
};
const buildOutInterval = 1000;
const sceneBuildOutFunctions = [];
const nodeLabels = [];
const light = new THREE.DirectionalLight(0xffffff);
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const noSleep = new NoSleep();
const stageSize = 10;

let globalData = {};
let initData = {};
let flourishState = {};
let timer = null;
let lastTime = 0;
let shadertime = 0;

let scene;
let effect;
let camera;
let renderer;
let controls;
let vrDisplay;
let intersected;
let hoveredButton;
let lineMaterials;
let sphereMaterials;
let animationHandle;


function updateNetwork() {
  sceneObjects.nodes.children
    .forEach((n) => {
      const [nd] = globalData.nodes.filter(d => d.id === n.userData.id);
      if (!nd.shifted) {
        nd.lastPos = nd.pos;
      }
      n.children.forEach((c) => {
        if (c.userData.type === 'sphere') {
          c.material.dispose(); // Dispose existing geometry
          c.material = null;
          if (nd.status === 'center') {
            c.currentMaterial = sphereMaterials[n.userData.category].selected;
            c.material = sphereMaterials[n.userData.category].highlight;
            c.children[0].material.visible = true;
          } else if (nd.status === 'adjacent') {
            c.material = sphereMaterials[n.userData.category].adjacent;
            c.children[0].material.visible = false;
          } else {
            c.material = sphereMaterials[n.userData.category].basic;
            c.children[0].material.visible = false;
          }
        } else if (c.name === 'name') {
          c.position.set(nd.nameOffset.x, nd.nameOffset.y, 0.15);
          c.material.visible = true;
        } else if (c.name === 'rank') {
          c.material.visible = true;
        }
      });
      n.userData.status = nd.status;
      n.userData.nextPos = nd.pos;
    });
  sceneObjects.links.children.forEach((l) => {
    l.userData.nextSPos = globalData.nodes.filter(n => l.userData.source === n.id)[0].pos;
    l.userData.nextTPos = globalData.nodes.filter(n => l.userData.target === n.id)[0].pos;
  });
  sceneObjects.buttons.children.forEach((b) => {
    if (b.name === 'updating') {
      b.visible = false;
    } else {
      b.visible = true;
    }
  });
  worldState.isTransitioning = true;
  worldState.labelsNeedUpdate = true;
}

function setActiveButton(button) {
  sceneObjects.buttons.children.forEach((b) => {
    if (b.userData.name === button) {
      b.children.filter(c => c.userData.type === 'button').forEach((c) => {
        c.material.opacity = 0.0;
      });
    } else {
      b.children.filter(c => c.userData.type === 'button').forEach((c) => {
        c.material.opacity = 0.1;
      });
    }
  });
}

function layoutByRank(button = 'Spiral') {
  const rowCount = 1 + Math.ceil(globalData.nodes.length / 35);
  const perRow = Math.ceil(globalData.nodes.length / rowCount);

  globalData.nodes.sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));

  globalData.nodes = globalData.nodes.map((n, i) => {
    n.shifted = false;
    n.status = '';
    n.nameOffset = new THREE.Vector2(0, -0.1);
    n.pos = new THREE.Vector3(
      Math.cos(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
      (controls.userHeight / (1 + (rowCount * 0.5))) + (((i / 3) * 2) / perRow),
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

  setActiveButton(button);

  updateNetwork();
}

function layoutInGrid(button = 'Grid') {
  const perRow = 10;
  const rowCount = Math.ceil(globalData.nodes.length / perRow);

  globalData.nodes.sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));

  globalData.nodes = globalData.nodes.map((n, i) => {
    n.shifted = false;
    n.status = '';
    n.nameOffset.x = 0;
    n.nameOffset.y = -0.1;
    n.pos = new THREE.Vector3(
      (-stageSize / 2) + ((stageSize / perRow) * (0.5 + (i % perRow))),
      (0.75 + Math.floor(i / perRow)) * ((stageSize / 2) / rowCount),
      -stageSize / 3,
    );
    return n;
  });

  globalData.links = globalData.links.map((l) => {
    l.spos = globalData.nodes.filter(n => l.sourceId === n.id)[0].pos;
    l.tpos = globalData.nodes.filter(n => l.targetId === n.id)[0].pos;
    return l;
  });

  initData = cloneDeep(globalData);

  setActiveButton(button);

  updateNetwork();
}

function layoutByForce(button = 'Simulation') {
  const simulation = d3Force.forceSimulation()
    .numDimensions(3)
    .nodes(globalData.nodes)
    .force('link', d3Force.forceLink().id(d => d.id).links(globalData.links))
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
        scaleValue.toRangeWithGap(
          n.x,
          dimensionMap.x,
          {
            min: 0,
            max: stageSize,
          },
          stageSize / 10,
        ),
        scaleValue.toRange(
          n.y,
          dimensionMap.y,
          {
            min: controls.userHeight * 1.5,
            max: controls.userHeight * 3.0,
          },
        ),
        scaleValue.toRangeWithGap(
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

    setActiveButton(button);

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

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
}

function enableNoSleep() {
  noSleep.enable();
  // window.removeEventListener('touchstart', enableNoSleep, true);
}

export function requestPresent() {
  enableNoSleep();
  if (vrDisplay.capabilities.canPresent) {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }
}

export function toggleVREnabled(set, value) {
  enableNoSleep();
  // TODO: remove stereo from desktop when done w/ development
  if (set === true && value !== undefined) {
    worldState.vrEnabled = value;
  } else {
    worldState.vrEnabled = !worldState.vrEnabled;
  }
  flourishState.vrEnabled = worldState.vrEnabled;
  if (worldState.vrEnabled) {
    if (vrDisplay.capabilities.canPresent) {
      vrDisplay.requestPresent([{ source: document.body }]);
      // worldState.vrEnabled = !worldState.vrEnabled;
    }
    document.querySelector('#vrbutton').classList.add('enabled');
    document.querySelector('#centerline').classList.add('enabled');
  } else {
    if (vrDisplay.capabilities.canPresent) {
      vrDisplay.exitPresent();
      // worldState.vrEnabled = !worldState.vrEnabled;
    }
    document.querySelector('#vrbutton').classList.remove('enabled');
    document.querySelector('#centerline').classList.remove('enabled');
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
}

function showIntroduction() {
  worldState.intro.active = true;
  worldState.intro.returning = true;
  sceneObjects.buttons.children.forEach((b) => {
    if (b.name === 'updating') {
      b.visible = false;
    } else {
      b.visible = true;
    }
  });
}

function transitionElements() {
  if (worldState.intro.active) {
    sceneObjects.intro.quaternion.copy(camera.quaternion);
    if (worldState.intro.zooming) {
      sceneObjects.intro.visible = false;
      const userTarget = new THREE.Vector3(0, 0, 0);
      if (sceneObjects.user.position.distanceTo(userTarget) > 0.01) {
        const tpos = new THREE.Vector3(
          sceneObjects.user.position.x,
          sceneObjects.user.position.y,
          sceneObjects.user.position.z,
        ).lerp(userTarget, 0.1);
        sceneObjects.user.position.set(tpos.x, tpos.y, tpos.z);
      } else {
        worldState.intro.zooming = false;
        worldState.intro.active = false;
      }
      return;
    } else if (worldState.intro.returning) {
      const userTarget = new THREE.Vector3(0, 0, (stageSize / 3) * 2);
      if (sceneObjects.user.position.distanceTo(userTarget) > 0.01) {
        const tpos = new THREE.Vector3(
          sceneObjects.user.position.x,
          sceneObjects.user.position.y,
          sceneObjects.user.position.z,
        ).lerp(userTarget, 0.1);
        sceneObjects.user.position.set(tpos.x, tpos.y, tpos.z);
      } else {
        worldState.intro.return = false;
        sceneObjects.intro.visible = true;
      }
    }
  }
  //
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
    if (Math.abs(n.scale.x - n.userData.nextScale) > 0.01) {
      const tscale = THREE.Math.lerp(n.scale.x, n.userData.nextScale, 0.1);
      n.scale.set(tscale, tscale, tscale);
    }
    n.quaternion.copy(camera.quaternion);
  });
  if (countTransitioning > 0) {
    worldState.isTransitioning = true;
    worldState.labelsNeedUpdate = true;
    sceneObjects.links.children.forEach((l) => {
      l.material.visible = false;
    });
  } else {
    worldState.isTransitioning = false;
  }
  //
  if (!worldState.isTransitioning && worldState.labelsNeedUpdate) {
    const labelRaycaster = new THREE.Raycaster();
    sceneObjects.nodes.children.forEach((n) => {
      const direction = new THREE.Vector3()
        .subVectors(
          new THREE.Vector3(n.position.x, n.position.y, n.position.z),
          camera.position,
        ).normalize();

      labelRaycaster.set(
        camera.position,
        direction,
      );
      const names = new Set();
      const intersects = labelRaycaster.intersectObjects(sceneObjects.nodes.children, true)
        .filter(c => c.object.userData.type === 'sphere')
        .map((c) => {
          c.object.parent.userData.distance = c.distance;
          return c.object.parent;
        }).filter((g) => {
          if (names.has(g.userData.name)) {
            return false;
          }
          names.add(g.userData.name);
          return true;
        });
      if (intersects.length > 1) {
        intersects
          .sort((a, b) => a.userData.distance < b.userData.distance)
          .forEach((g, i) => {
            if (i < (intersects.length - 1)) {
              g.children.forEach((c) => {
                if (c.userData.type === 'text') {
                  c.material.visible = false;
                }
              });
            }
          });
      }
    });
    //
    sceneObjects.links.children.forEach((l) => {
      if (
        (l.userData.spos.distanceTo(l.userData.nextSPos) > 0.01)
        ||
        (l.userData.tpos.distanceTo(l.userData.nextTPos) > 0.01)
      ) {
        l.geometry.dispose(); // Dispose existing geometry
        l.geometry = null;
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
        const { lineGeometry, lineLength } = generateCurveGeometry(
          l.userData.spos,
          l.userData.tpos,
          controls.userHeight,
        );
        const line = new MeshLine();
        line.setGeometry(
          lineGeometry,
          () => scaleValue.toRange(l.userData.value, { min: 1, max: 100 }, linkScale),
        );
        const lineMesh = new THREE.Mesh(line.geometry, lineMaterials.basic);
        l.geometry = lineMesh.geometry;
        l.geometry.attributes.position.needsUpdate = true;
        const lengths = new Float32Array(l.geometry.attributes.position.count)
          .fill(lineLength);

        l.geometry.addAttribute('lineLength', new THREE.Float32BufferAttribute(lengths, 1));

        if (l.userData.status === 'out') {
          l.material.visible = true;
        } else if (l.userData.status === 'in') {
          l.material.visible = true;
        }
      }
    });
    //
    worldState.labelsNeedUpdate = false;
  }
  //
}

function resetLinks() {
  sceneObjects.links.children.forEach((l) => {
    l.material.dispose(); // Dispose existing geometry
    l.material = null;
    l.material = lineMaterials.basic;
    l.material.visible = false;
    l.userData.status = '';
  });
}

function resetIntersected() {
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
}

function checkIntersected() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  if (hoveredButton) {
    hoveredButton.opacity = hoveredButton.lastOpacity;
    hoveredButton = null;
  }
  //
  let objectsToCheck = [];
  if (worldState.intro.active) {
    if (scene.getObjectByName('Explore', true)) objectsToCheck.push(scene.getObjectByName('Explore', true));
    if (scene.getObjectByName('GOT IT', true)) objectsToCheck.push(scene.getObjectByName('GOT IT', true));
  } else {
    if (sceneObjects.nodes.children) {
      objectsToCheck = [...new Set([...objectsToCheck, ...sceneObjects.nodes.children])];
    }
    if (sceneObjects.buttons.children) {
      objectsToCheck = [...new Set([...objectsToCheck, ...sceneObjects.buttons.children])];
    }
    if (scene.getObjectByName('info', true)) objectsToCheck.push(scene.getObjectByName('info', true));
  }
  const intersects = [...new Set([...raycaster.intersectObjects(objectsToCheck, true)])];
  //
  if (intersects.length > 0) {
    let searching = true;
    let index = 0;
    let nextIntersected = null;
    let foundCurrent = false;
    intersects.forEach((o) => {
      if (
        o.object.parent === intersected
        &&
        (
          (
            intersects[index].distance > (stageSize / 2)
              &&
            intersects[index].object.userData.type === 'text'
          )
            ||
          o.object.userData.type === 'sphere'
            ||
          o.object.userData.type === 'button'
        )
      ) {
        if (intersected.userData.type === 'node') {
          const scaleBy = Math.ceil(intersected.position.distanceTo(camera.position) / 2);
          intersected.userData.nextScale = scaleBy;
        }
        if (intersected.userData.status !== 'center') {
          foundCurrent = true;
        }
      }
    });
    //
    while (searching) {
      if (
        (
          intersects[index].distance > (stageSize / 2)
            &&
          intersects[index].object.userData.type === 'text'
        )
            ||
          intersects[index].object.userData.type === 'sphere'
            ||
          intersects[index].object.userData.type === 'button'
      ) {
        if (intersects[index].object.parent !== intersected) {
          nextIntersected = intersects[index].object;
        }
        if (intersects[index].object.userData.type === 'button') {
          const lastOpacity = intersects[index].object.material.opacity;
          intersects[index].object.material.opacity = 0.5;
          hoveredButton = intersects[index].object.material;
          hoveredButton.lastOpacity = lastOpacity;
        }
        searching = false;
      }
      index += 1;
      if (index > intersects.length - 1) {
        searching = false;
      }
    }
    //
    if (nextIntersected !== null) {
      light.target = nextIntersected;
      if (intersected) {
        resetIntersected();
      }
      timer = 0;
      intersected = nextIntersected.parent;
      //
      const name = intersected.name || intersected.userData.name;
      const type = intersected.userData.type === 'node' ? 'node' : 'button';
      sendEvent('look', type, name);
      //
      if (intersected.userData.type === 'node') {
        sceneObjects.links.children.forEach((l) => {
          l.material.dispose(); // Dispose existing geometry
          l.material = null;
          if (l.userData.source === intersected.userData.id) {
            l.material = lineMaterials.highlightOut;
            l.material.visible = true;
            l.userData.status = 'out';
          } else if (l.userData.target === intersected.userData.id) {
            l.material = lineMaterials.highlightIn;
            l.material.visible = true;
            l.userData.status = 'in';
          } else {
            l.material = lineMaterials.basic;
            l.material.visible = false;
            l.userData.status = '';
          }
        });
        const scaleBy = Math.ceil(intersected.position.distanceTo(camera.position) / 2);
        intersected.userData.nextScale = scaleBy;
        intersected.children.forEach((c) => {
          if (c.userData.type === 'sphere') {
            const [cn] = sceneObjects.nodes.children.filter(n => n.userData.status === 'center');
            if (intersected.userData.status === 'center') {
              c.currentMaterial = sphereMaterials[intersected.userData.category].selected;
            } else if (intersected.userData.status === 'adjacent') {
              c.currentMaterial = sphereMaterials[intersected.userData.category].adjacent;
              if (cn) {
                cn.children[0].material = sphereMaterials[cn.userData.category].selected;
                cn.children[0].children[0].visible = true;
              }
            } else {
              c.currentMaterial = sphereMaterials[intersected.userData.category].basic;
              if (cn) {
                cn.children[0].material = sphereMaterials[cn.userData.category].adjacent;
                cn.children[0].children[0].visible = false;
              }
            }
            c.material.dispose(); // Dispose existing geometry
            c.material = null;
            if (intersected.userData.status === 'center') {
              c.material = sphereMaterials[intersected.userData.category].highlight;
              c.children[0].material.visible = true;
            } else {
              c.material = sphereMaterials[intersected.userData.category].selected;
              c.children[0].material.visible = false;
            }
          } else {
            c.material.visible = true;
          }
        });
      }
    }
    //
    if (foundCurrent && timer === null) {
      timer = 0;
    } else if (!foundCurrent && timer !== null) {
      //
      if (hoveredButton) {
        hoveredButton.opacity = hoveredButton.lastOpacity;
        hoveredButton = null;
      }
      //
      timer = null;
      sceneObjects.cursor.children[3].geometry.dispose(); // Dispose existing geometry
      sceneObjects.cursor.children[3].geometry = null;
      sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
    }
  } else {
    //
    if (hoveredButton) {
      hoveredButton.opacity = hoveredButton.lastOpacity;
      hoveredButton = null;
    }
    //
    timer = null;
    sceneObjects.cursor.children[3].geometry.dispose(); // Dispose existing geometry
    sceneObjects.cursor.children[3].geometry = null;
    sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(0.02, 0.03, 24, 8, 0, 0);
  }
}

function takeAction(centerNode) {
  //
  const name = centerNode.name || centerNode.type;
  const type = centerNode.type === 'node' ? 'node' : 'button';
  sendEvent('fuse', type, name);
  //
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
      Math.cos(angle) * (stageSize / 4),
      centerData.pos.y + ((controls.userHeight - centerData.pos.y) / 2),
      Math.sin(angle) * (stageSize / 4),
    );

    const linkCount = linked.length;
    const phi = (Math.PI * 2) / linkCount;
    const radius = 0.5 + (linkCount / 25);
    const theta = angle + (90 * (Math.PI / 180));

    let i = 0;
    globalData.nodes.forEach((n) => {
      n.nameOffset.x = 0;
      n.nameOffset.y = -0.1;
      if (n.id === centerNode.id) {
        n.shifted = true;
        n.status = 'center';
      } else if (linked.includes(n.id)) {
        n.shifted = true;
        n.status = 'adjacent';
        const xzradius = Math.cos(i * (Math.PI / (linkCount / 2))) * radius;
        n.pos = new THREE.Vector3(
          centerData.pos.x + (Math.cos(theta) * xzradius),
          centerData.pos.y + (Math.sin(phi * i) * radius),
          centerData.pos.z + (Math.sin(theta) * xzradius),
        );
        i += 1;
        //
        n.nameOffset.x = xzradius * 0.1;
        n.nameOffset.y = Math.sin(phi * i) * 0.1;
        if (n.nameOffset.y < 0.1 && n.nameOffset.y >= 0) {
          n.nameOffset.y = 0.1;
        } else if (n.nameOffset.y > -0.1 && n.nameOffset.y < 0) {
          n.nameOffset.y = -0.1;
        }
      } else {
        n.shifted = false;
        n.status = '';
        n.pos = n.lastPos;
        const oangle = Math.atan2(n.pos.z, n.pos.x);
        n.pos = new THREE.Vector3(
          Math.cos(oangle) * (stageSize / 2),
          n.pos.y,
          Math.sin(oangle) * (stageSize / 2),
        );
      }
    });

    updateNetwork();
  } else if (centerNode.type === 'button') {
    sceneObjects.buttons.children.forEach((b) => {
      if (b.name === 'updating' || b.name === 'title') {
        b.visible = true;
      } else {
        b.visible = false;
      }
    });
    if (hoveredButton) {
      hoveredButton.opacity = hoveredButton.lastOpacity;
      hoveredButton = null;
    }
    timer = null;
    resetLinks();
    switch (centerNode.name) {
      case 'Spiral':
        layoutByRank();
        break;
      case 'Grid':
        layoutInGrid();
        break;
      case 'Simulation':
        layoutByForce();
        break;
      case 'info':
        showIntroduction();
        break;
      default:
        globalData = cloneDeep(initData);
        break;
    }
  } else if (centerNode.type === 'GOT IT') {
    worldState.intro.zooming = true;
    layoutByRank();
  }
}

function updateCursor() {
  if (!worldState.isTransitioning) {
    checkIntersected();
    //
    if (timer !== null) {
      if (timer < Math.PI * 2) {
        const elapsed = (performance.now() - lastTime);
        timer += ((Math.PI * 2) / 2000) * elapsed;
        sceneObjects.cursor.children[3].geometry.dispose(); // Dispose existing geometry
        sceneObjects.cursor.children[3].geometry = null;
        sceneObjects.cursor.children[3].geometry = new THREE.RingGeometry(
          0.02,
          0.03,
          24,
          8,
          -timer,
          timer,
        );
      } else {
        takeAction(intersected.userData);
      }
    }
    lastTime = performance.now();
  } else {
    timer = null;
    sceneObjects.cursor.children[3].geometry.dispose(); // Dispose existing geometry
    sceneObjects.cursor.children[3].geometry = null;
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

function animate() { // Request animation frame loop function
  TWEEN.update();
  if (!worldState.intro.updating) {
    controls.update();
  }
  sceneObjects.lookup.quaternion.copy(camera.quaternion);

  const time = performance.now() * 0.01;
  if (scene.getObjectByName('updating')) {
    scene.getObjectByName('updating').material.opacity = Math.abs(Math.cos(time / 5.0));
  }
  stars.update(sceneObjects.stars, stageSize, time);

  shadertime += 0.1;
  if (shadertime > 100) {
    shadertime = 0.0;
  }
  lineMaterials.highlightOut.uniforms.time.value = shadertime;
  lineMaterials.highlightIn.uniforms.time.value = shadertime;

  // $$$
  transitionElements();
  updateCursor();
  //

  if (worldState.vrEnabled) {
    effect.render(scene, camera); // Render the scene.
  } else {
    renderer.render(scene, camera);
  }
  animationHandle = vrDisplay.requestAnimationFrame(animate);
}

function setupStage() {
  navigator.getVRDisplays().then((displays) => {
    if (displays.length > 0) {
      [vrDisplay] = displays;
      animationHandle = vrDisplay.requestAnimationFrame(animate);
    }
  });
}

function drawNetwork() {
  layoutByRandom();
  globalData.links.forEach((l) => {
    const { lineGeometry, lineLength } = generateCurveGeometry(l.spos, l.tpos, controls.userHeight);
    const line = new MeshLine();
    line.setGeometry(
      lineGeometry,
      () => scaleValue.toRange(l.value, { min: 1, max: 100 }, linkScale),
    );
    const lengths = new Float32Array(line.geometry.attributes.position.count)
      .fill(lineLength);

    line.geometry.addAttribute('lineLength', new THREE.Float32BufferAttribute(lengths, 1));
    const lineMesh = new THREE.Mesh(line.geometry, lineMaterials.basic);

    lineMesh.userData.source = l.source;
    lineMesh.userData.spos = l.spos;
    lineMesh.userData.target = l.target;
    lineMesh.userData.tpos = l.tpos;
    lineMesh.userData.value = l.value;
    sceneObjects.links.add(lineMesh);
  });
  sceneObjects.links.name = 'links';
  scene.add(sceneObjects.links);

  const sphereGeometry = new THREE.SphereGeometry(0.1, 18, 18);
  globalData.nodes.forEach((d) => {
    const node = new THREE.Group();
    node.userData.type = 'node';
    node.userData.name = d.name;
    node.userData.id = d.id;
    node.userData.category = d.category;
    //
    node.shifted = false;
    node.status = '';
    node.position.set(d.pos.x, d.pos.y, d.pos.z);
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterials[node.userData.category].basic);
    sphere.userData.type = 'sphere';

    // Sprite Glow Effect
    const spriteMaterial = new THREE.SpriteMaterial({
      map: textureLoader.load(`${Flourish.static_prefix}/glow.png`),
      color: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.userData.type = 'glow';
    sprite.position.set(0, 0, 0.1);
    sprite.scale.set(0.4, 0.4, 0.4);
    sprite.material.visible = false;
    sphere.add(sprite);
    node.add(sphere);

    let weight = '';
    if (d.rank <= 20) {
      weight = 'bold ';
    } else if (d.rank > 40) {
      weight = '300 ';
    }

    const rank = generateTextureCanvas(`${d.rank}`, 64, 1024, 256, weight, false, 0);
    rank.scale.set(0.001, 0.001, 0.001);
    rank.position.set(0, 0, 0.15);
    rank.userData.type = 'text';
    rank.name = 'rank';

    const text = generateTextureCanvas(`${d.name}`, 64, 1024, 256, weight, false, 0);
    text.scale.set(0.001, 0.001, 0.001);
    text.position.set(0, -0.1, 0.15);
    text.userData.type = 'text';
    text.name = 'name';

    nodeLabels.push([node, [rank, text]]);

    sceneObjects.nodes.add(node);
  });
  sceneObjects.nodes.name = 'nodes';
  scene.add(sceneObjects.nodes);

  setupStage();

  updateNetwork();

  layoutInGrid();
}

function formatData() {
  globalData.links = globalData.links.map((l) => {
    l.sourceId = l.source;
    l.targetId = l.target;
    return l;
  });
  globalData.links = globalData.links.filter(l =>
    globalData.nodes.filter(n => (l.sourceId === n.id || l.targetId === n.id)).length > 1);
  globalData.nodes = globalData.nodes.map((n) => {
    n.nameOffset = new THREE.Vector2(0, -0.1);
    n.linkCount = globalData.links.filter(l => (l.sourceId === n.id || l.targetId === n.id)).length;
    return n;
  });
  globalData.nodes = globalData.nodes.filter(n => n.linkCount);
  //
  drawNetwork();
}

function buildOutScene() {
  if (sceneBuildOutFunctions.length === 0) {
    vrDisplay.resetPose();
    worldState.intro.updating = false;
    return;
  }
  const nextStep = sceneBuildOutFunctions.shift();
  nextStep();
  setTimeout(buildOutScene, buildOutInterval);
}

export function sceneReady() {
  setTimeout(buildOutScene, 500);
}

function updateColorMap(state, datacategories) {
  state.colorMap = [];
  state.colorMap.push({
    name: 'default_no_category',
    basic: state.basicNodeColor,
    adjacent: state.adjacentNodeColor,
    highlight: state.highlightNodeColor,
  });
  if (datacategories.length) {
    datacategories.forEach((c) => {
      c.name = c.name.trim().toLowerCase();
      state.colorMap.push(c);
    });
  }
  return state;
}

function updateCategories(nodes, colorMap) {
  const categoryNames = colorMap.map(c => c.name);
  return nodes.map((n) => {
    if (n.category) {
      n.category = n.category.trim().toLowerCase();
      if (!categoryNames.includes(n.category)) {
        n.category = 'default_no_category';
      }
    } else {
      n.category = 'default_no_category';
    }
    return n;
  });
}

export function setupScene(data, state) {
  globalData = data;
  state = updateColorMap(state, data.categories);
  flourishState = state;
  globalData.nodes = updateCategories(globalData.nodes, state.colorMap);

  sphereMaterials = updateSphereMaterials(state);
  lineMaterials = updateLineMaterials(state);
  lineMaterials.basic.visible = false;

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
  camera.name = 'camera';

  controls = new VRControls(camera);
  controls.standing = true;
  camera.position.y = controls.userHeight;

  const ctx = renderer.context;
  ctx.getShaderInfoLog = () => ''; // Quiet shader complaint log: GL_ARB_gpu_shader5

  // Light
  scene.add(light);

  // Generate Non-network Scene Elements
  scene.add(generateHorizon(
    flourishState.horizonTopColor,
    flourishState.horizonBottomColor,
    flourishState.horizonExponent,
    true,
  ));
  scene.add(stars.generate(sceneObjects.stars, stageSize, 1000));
  scene.add(legend.generate(state, lineMaterials, controls.userHeight));
  scene.add(generateButtons(sceneObjects.buttons));

  sceneObjects.intro = intro.generate(state, stageSize);
  scene.add(sceneObjects.intro);
  sceneObjects.user.add(sceneObjects.lookup);

  //
  const cover = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 800),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1.0,
    }),
  );
  cover.scale.set(0.001, 0.001, 0.001);
  cover.position.set(0, 0.6, 0);
  cover.name = 'cover';
  scene.add(cover);
  //
  const imgGeometry = new THREE.PlaneGeometry(512, 256);
  const lookMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load(`${Flourish.static_prefix}/lookup.png`),
    transparent: true,
    depthTest: false,
  });
  sceneObjects.lookup.add(new THREE.Mesh(imgGeometry, lookMaterial));
  sceneObjects.lookup.name = 'lookup';
  sceneObjects.lookup.rotation.set((Math.PI / 180) * -45, 0, 0);
  sceneObjects.lookup.scale.set(0.0025, 0.0025, 0.0025);
  //
  sceneObjects.cursor = cursor.generate(state);
  camera.add(sceneObjects.cursor);
  sceneObjects.user.add(camera);
  sceneObjects.user.position.set(0, 0, (stageSize / 3) * 2);
  scene.add(sceneObjects.user);

  // Apply VR stereo rendering to renderer.
  effect = new StereoEffect(renderer);
  effect.setSize(window.innerWidth, window.innerHeight);

  // Event Listeners
  window.addEventListener('resize', onResize, true);
  window.addEventListener('vrdisplaypresentchange', onResize, true);
  window.addEventListener('touchstart', enableNoSleep, true);
  document.querySelector('#vrbutton').addEventListener('click', () => {
    sendEvent('click', 'button', 'toggleVR');
    toggleVREnabled();
  }, true);

  //
  formatData();

  //
  sceneBuildOutFunctions.push(updateHorizonVisibility);
  sceneBuildOutFunctions.push(stars.updateStarMaterial);
  sceneBuildOutFunctions.push(() => {
    updateSphereOpacity();
    nodeLabels.forEach((node) => {
      // add the rank & name label to the node object
      node[0].add(node[1][0]);
      node[0].add(node[1][1]);
    });
    const baseOpacity = { opacity: 0 };
    new TWEEN.Tween(baseOpacity)
      .to({ opacity: 1 }, buildOutInterval)
      .onUpdate(() => {
        nodeLabels.forEach((node) => {
          node[1][0].material.opacity = baseOpacity.opacity;
          node[1][1].material.opacity = baseOpacity.opacity;
        });
      }).start();
  });
  sceneBuildOutFunctions.push(() => {
    const baseOpacity = { opacity: 1 };
    new TWEEN.Tween(baseOpacity)
      .to({ opacity: 0 }, buildOutInterval)
      .onUpdate(() => {
        cover.material.opacity = baseOpacity.opacity;
      }).start();
  });
  sceneBuildOutFunctions.push(() => {
    const baseOpacity = { opacity: 0 };
    new TWEEN.Tween(baseOpacity)
      .to({ opacity: 1 }, buildOutInterval)
      .onUpdate(() => {
        sceneObjects.intro.children.forEach((c) => {
          if (c.children.length) {
            c.children.forEach((m) => {
              m.material.opacity = baseOpacity.opacity;
            });
          } else if (c.name === 'background' && baseOpacity.opacity > 0.75) {
            c.material.opacity = 0.75;
          } else {
            c.material.opacity = baseOpacity.opacity;
          }
        });
      }).start();
  });
}

export function updateSceneFromState(data, state) {
  //
  vrDisplay.cancelAnimationFrame(animationHandle);
  globalData = data;
  state = updateColorMap(state, data.categories);
  globalData.nodes = updateCategories(globalData.nodes, state.colorMap);
  //
  sceneObjects.nodes = new THREE.Group();
  scene.remove(scene.getObjectByName('nodes', true));
  sceneObjects.links = new THREE.Group();
  scene.remove(scene.getObjectByName('links', true));
  //
  formatData();
  //
  nodeLabels.forEach((node) => {
    node[0].add(node[1][0]);
    node[0].add(node[1][1]);
  });
  const baseOpacity = { opacity: 0 };
  new TWEEN.Tween(baseOpacity)
    .to({ opacity: 1 }, 1)
    .onUpdate(() => {
      nodeLabels.forEach((node) => {
        node[1][0].material.opacity = baseOpacity.opacity;
        node[1][1].material.opacity = baseOpacity.opacity;
      });
    }).start();
  //
  if (!worldState.intro.active) {
    layoutByRank();
  }
  //
  //
  flourishState = state;
  //
  camera.remove(camera.getObjectByName('cursor', true));
  sceneObjects.cursor = cursor.generate(state);
  camera.add(sceneObjects.cursor);
  //
  sphereMaterials = updateSphereMaterials(state);
  updateSphereOpacity();
  //
  lineMaterials = updateLineMaterials(flourishState);
  lineMaterials.basic.visible = false;
  //
  scene.remove(scene.getObjectByName('legend', true));
  scene.add(legend.generate(state, lineMaterials, controls.userHeight));
  //
  sceneObjects.nodes.children.forEach((n) => {
    n.children.forEach((c) => {
      if (c.name === '') {
        c.material = sphereMaterials[n.userData.category].basic;
      }
    });
  });
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
    false,
  ));
  //
}

export default setupScene;
