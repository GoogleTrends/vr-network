This template is designed to show realtionships between nodes in a network visualized in a 3D space, and viewable in VR on mobile devices using Google Cardboard headsets. 

## Data requirements
This network requires two data tables. The first are the nodes. Each row represents a node in the network and requires an id, rank, and name, an optional category column can be included. The second are the links, which require a source, the id of a node to draw the line from, a target, the id of a node to draw the line to, and a value, quantifying the relationship between the two. Finally, an optional categories table can be used to customize the color of the nodes based on their category column.

## Tips
* You can edit the logo, title, description, and add your own google analytics tracking id in the Flourish interface.
* Node, link, cursor, and horizon colors can all also be customized.
* Nodes which are not linked to any other part of the network, and links which have a non-existant source or target will be ignored.

## Credits
Created by [Pitch Interactive](http://pitchinteractive.com/) and [Google News Lab](https://newslab.withgoogle.com/).
