/*
  file: updateCategories.js
  description: Format categories in data to match custom colors
  company: Pitch Interactive
  author: James Proctor
  license: MIT
*/

export function updateCategories(nodes, colorMap) {
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

export default updateCategories;
