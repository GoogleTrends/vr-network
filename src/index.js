import { setupScene, updateSceneFromState } from './main';

export const data = {};

// The current state of template. You can make some or all of the properties
// of the state object available to the user as settings in settings.js.
export const state = {
  horizonTopColor: '#000000',
  horizonBottomColor: '#ff7700',
  horizonExponent: 0.05,
  // opacity: 0.5,
};

// let w;
// let h;
// let svg;
// const popup = Popup();

// function setAttributes(selectionOrTransition) {
//   selectionOrTransition
//     .attr('fill', state.color)
//     .attr('opacity', state.opacity)
//     .attr('cx', d => d.x * w)
//     .attr('cy', d => d.y * h)
//     .attr('r', d => Math.sqrt(d.size));
// }

// The update function is called whenever the user changes a data table or settings
// in the visualisation editor, or when changing slides in the story editor.
// Tip: to make your template work nicely in the story editor, ensure that all user
// interface controls such as buttons and sliders update the state and then call update.
export function update() {
  updateSceneFromState(state);
  // console.log(data);
  // if (state.radius <= 0) throw new Error('Radius must be positive');
  // const circles = svg.selectAll('circle').data(data.circles);
  // circles.enter()
  //   .append('circle')
  //   .on('click', (d) => {
  //     popup.point(d.x * w, d.y * h).html(d.word).draw();
  //     event.stopPropagation();
  //   })
  //   .call(setAttributes);
  // circles.transition()
  //   .call(setAttributes);
  // circles.exit()
  //   .remove();
}

// The draw function is called when the template first loads
export function draw() {
  setupScene(data, state);
  // w = window.innerWidth;
  // h = window.innerHeight;
  // svg = select(document.body)
  //   .append('svg')
  //   .attr('width', w)
  //   .attr('height', h)
  //   .on('click', () => {
  //     popup.hide();
  //   });
  // update();
}
