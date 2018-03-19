window = require('svgdom');
document = window.document;
Element = Node = window.Node;
window.matchMedia = () => console.log('DONT CALL THIS!');
document.implementation = {hasFeature: () => false};
module.exports = window;
