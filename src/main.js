/* global window, document, navigator, performance, Flourish */

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
import { generateHorizon } from './elements/horizon';
import { generateFloor } from './elements/floor';
import { generateButtons } from './elements/buttons';
import { updateLineMaterials } from './materials/lineMaterials';
import * as sphereMaterials from './materials/sphereMaterials';
import * as legend from './elements/legend';
import * as cursor from './elements/cursor';
import * as scaleValue from './scaleValue';
import * as stars from './elements/stars';

const worldState = {
  vrEnabled: false,
  layoutMode: 1,
  isTransitioning: false,
  labelsNeedUpdate: true,
};
const sceneObjects = {
  nodes: new THREE.Group(),
  links: new THREE.Group(),
  stars: new THREE.Group(),
  cursor: new THREE.Group(),
  buttons: new THREE.Group(),
};
const linkScale = {
  min: 1,
  max: 3,
};
const light = new THREE.DirectionalLight(0xffffff);
const noSleep = new NoSleep();
const stageSize = 10;

let globalData = {};
let initData = {};
let flourishState = {};
let timer = null;
let shadertime = 0;
let scene;
let effect;
let camera;
let renderer;
let controls;
let vrDisplay;
let raycaster;
let intersected;
let lineMaterials;
let hoveredButton;

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
            c.currentMaterial = sphereMaterials.selected;
            c.material = sphereMaterials.highlight;
            c.children[0].material.visible = true;
          } else if (nd.status === 'adjacent') {
            c.material = sphereMaterials.adjacent;
            c.children[0].material.visible = false;
          } else {
            c.material = sphereMaterials.basic;
            c.children[0].material.visible = false;
          }
        } else if (c.name === 'name') {
          c.position.set(nd.nameOffset.x, nd.nameOffset.y, 0.15);
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
}

function layoutByRank() {
  const rowCount = 3;
  const perRow = Math.ceil(globalData.nodes.length / rowCount);

  globalData.nodes.sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));

  globalData.nodes = globalData.nodes.map((n, i) => {
    n.shifted = false;
    n.status = '';
    n.pos = new THREE.Vector3(
      Math.cos(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
      (controls.userHeight / (rowCount * 0.5)) + (i / perRow),
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

function layoutInGrid() {
  // const rowCount = 12;
  // const perRow = Math.ceil(globalData.nodes.length / rowCount);
  const perRow = 10;

  globalData.nodes.sort((a, b) => parseInt(a.rank, 10) - parseInt(b.rank, 10));

  // let x = 0;
  globalData.nodes = globalData.nodes.map((n, i) => {
    n.shifted = false;
    n.status = '';
    n.pos = new THREE.Vector3(
      // Math.cos(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
      
      (-stageSize / 2) + (0.5 + (i % perRow)),
      // (controls.userHeight / (rowCount * 0.5)) + 
      1 + Math.floor(i / perRow),
      -stageSize / 2,
      // Math.sin(-(Math.PI / 2) + (((Math.PI * 2) / perRow) * i)) * (stageSize / 3),
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

function layoutByForce() {
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
  window.removeEventListener('touchstart', enableNoSleep, true);
}

function toggleVREnabled() {
  enableNoSleep();
  // TODO: remove stereo from desktop when done w/ development
  worldState.vrEnabled = !worldState.vrEnabled;
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

function hideIntro() {
  document.querySelector('#intro').classList.add('hide');
  toggleVREnabled();
}

function showIntro() {
  document.querySelector('#intro').classList.remove('hide');
  toggleVREnabled();
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
    if (Math.abs(n.scale.x - n.userData.nextScale) > 0.01) {
      const tscale = THREE.Math.lerp(n.scale.x, n.userData.nextScale, 0.1);
      n.scale.set(tscale, tscale, tscale);
    }
    n.quaternion.copy(camera.quaternion);
  });
  if (countTransitioning > 0) {
    worldState.isTransitioning = true;
    worldState.labelsNeedUpdate = true;
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
    worldState.labelsNeedUpdate = false;
  }
  //
  if (worldState.isTransitioning) {
    sceneObjects.links.children.forEach((l) => {
      l.material.visible = false;
    });
  } else {
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
        const lineGeometry = generateCurveGeometry(
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
        if (l.userData.status === 'out') {
          l.material.visible = true;
        } else if (l.userData.status === 'in') {
          l.material.visible = true;
        }
      }
    });
  }
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
        // intersects[index].object.parent !== intersected
        // &&
        (
          (
            intersects[index].distance > (stageSize / 2)
              &&
            intersects[index].object.userData.type === 'text'
          )
            ||
          intersects[index].object.userData.type === 'sphere'
            ||
          intersects[index].object.userData.type === 'button'
        )
      ) {
        if (intersects[index].object.parent !== intersected) {
          nextIntersected = intersects[index].object;
        }
        if (intersects[index].object.userData.type === 'button') {
          intersects[index].object.material.opacity = 0.25;
          hoveredButton = intersects[index].object.material;
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
            if (intersected.userData.status === 'center') {
              c.currentMaterial = sphereMaterials.selected;
            } else if (intersected.userData.status === 'adjacent') {
              c.currentMaterial = sphereMaterials.adjacent;
            } else {
              c.currentMaterial = sphereMaterials.basic;
            }
            c.material.dispose(); // Dispose existing geometry
            c.material = null;
            if (foundCurrent || intersected.userData.status === 'center') {
              c.material = sphereMaterials.highlight;
              c.children[0].material.visible = true;
            } else {
              c.material = sphereMaterials.selected;
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
        hoveredButton.opacity = 0.1;
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
      hoveredButton.opacity = 0.1;
      hoveredButton = null;
    }
    //
    timer = null;
    sceneObjects.cursor.children[3].geometry.dispose(); // Dispose existing geometry
    sceneObjects.cursor.children[3].geometry = null;
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
      Math.cos(angle) * (stageSize / 5),
      centerData.pos.y + ((controls.userHeight - centerData.pos.y) / 2),
      Math.sin(angle) * (stageSize / 5),
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
  } else {
    sceneObjects.buttons.children.forEach((b) => {
      if (b.name === 'updating') {
        b.visible = true;
      } else {
        b.visible = false;
      }
    });
    
    if (centerNode.name === 'Layout in Spiral') {
      layoutByRank();
    } else if (centerNode.name === 'Layout in Grid') {
      layoutInGrid();
    } else if (centerNode.name === 'Layout by Rank') {
      layoutByRank();
    } else if (centerNode.name === 'Layout by Simulation') {
      layoutByForce();
    } else {
      globalData = cloneDeep(initData);
    }
  }
}

function updateCursor() {
  if (!worldState.isTransitioning) {
    highlightIntersected();
    //
    if (timer !== null) {
      if (timer < Math.PI * 2) {
        timer += Math.PI / 30;
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
        makeLinkedAdjacent(intersected.userData);
      }
    }
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
  const time = performance.now() * 0.01;
  shadertime += 0.1;
  if (shadertime > 100) {
    shadertime = 0.0;
  }

  lineMaterials.highlightOut.uniforms.time.value = shadertime;
  lineMaterials.highlightIn.uniforms.time.value = shadertime;

  scene.getObjectByName('updating').material.opacity = Math.abs(Math.cos(time / 5.0));

  transitionElements();

  stars.update(sceneObjects.stars, stageSize, time);

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
      () => scaleValue.toRange(l.value, { min: 1, max: 100 }, linkScale),
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

    // Sprite Glow Effect
    const textureLoader = new THREE.TextureLoader();
    const spriteMaterial = new THREE.SpriteMaterial({
      map: textureLoader.load(`${Flourish.static_prefix}/glow.png`),
      color: 0xFF6F00, // 0xffA000,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.userData.type = 'glow';
    sprite.position.set(0, 0, 0.1);
    sprite.scale.set(0.4, 0.4, 0.4);
    sprite.material.visible = false;
    sphere.add(sprite);
    node.add(sphere);
    //

    //
    let weight = '';
    if (d.rank <= 20) {
      weight = 'bold ';
    } else if (d.rank > 40) {
      weight = '300 ';
    }
    //
    const rank = generateTextureCanvas(`${d.rank}`, 66, 1024, 256, weight);
    rank.scale.set(0.001, 0.001, 0.001);
    rank.position.set(0, 0, 0.15);
    rank.userData.type = 'text';
    node.add(rank);
    //
    const text = generateTextureCanvas(`${d.name}`, 66, 1024, 256, weight);
    text.scale.set(0.001, 0.001, 0.001);
    text.position.set(0, -0.1, 0.15);
    text.userData.type = 'text';
    text.name = 'name';
    node.add(text);
    //

    sceneObjects.nodes.add(node);
  });
  scene.add(sceneObjects.nodes);

  setupStage();

  updateNetwork();

  // layoutByRank();
  layoutInGrid();
}

function formatData() {
  globalData.links = globalData.links.map((l) => {
    l.sourceId = l.source;
    l.targetId = l.target;
    return l;
  });
  globalData.nodes = globalData.nodes.map((n) => {
    n.nameOffset = new THREE.Vector2(0, -0.1);
    n.linkCount = globalData.links.filter(l => (l.sourceId === n.id || l.targetId === n.id)).length;
    return n;
  });
  globalData.nodes = globalData.nodes.filter(n => n.linkCount);
  drawNetwork();
}

export function setupScene(data, state) {
  globalData = data;
  flourishState = state;
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
  ));
  scene.add(generateFloor(stageSize, controls.userHeight));
  scene.add(stars.generate(sceneObjects.stars, stageSize, 1000));
  scene.add(legend.generate(state, lineMaterials, controls.userHeight));
  scene.add(generateButtons(sceneObjects.buttons));

  sceneObjects.cursor = cursor.generate(state);
  camera.add(sceneObjects.cursor);
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
  document.querySelector('#inbutton').addEventListener('click', showIntro, true);
  document.querySelector('#explore').addEventListener('click', hideIntro, true);

  formatData();
}

export function updateSceneFromState(state) {
  flourishState = state;
  //
  camera.remove(camera.getObjectByName('cursor', true));
  sceneObjects.cursor = cursor.generate(state);
  camera.add(sceneObjects.cursor);
  //
  lineMaterials = updateLineMaterials(flourishState);
  lineMaterials.basic.visible = false;
  //
  scene.remove(scene.getObjectByName('legend', true));
  scene.add(legend.generate(state, lineMaterials, controls.userHeight));
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
