/*
  file: updateColorMap.js
  description: Update category colors to match flourish state
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function updateColorMap(state, datacategories) {
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

export default updateColorMap;
