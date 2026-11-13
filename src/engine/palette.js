/**
 * 64-colour sRGB palette for the whole game. The scene is quantised to these
 * values after an ordered dither (see post.js). Keep the length at exactly 64:
 * the shader declares vec3[64]. Adapted from the diorama kit's palette.js with
 * ramps for courts, sandstone and jungle instead of pool water.
 */
export const PALETTE_HEX = [
  // paper and warm neutrals
  '#ffffff', '#f3eddf', '#e1d7c5', '#c9bda9', '#a89c88', '#857f74', '#615d55', '#463f38',
  // cool greys and steel
  '#c7d3d8', '#9ba7ab', '#7f8b90', '#606b70', '#51575c', '#3b4449', '#2c3237', '#20282c',
  // greens
  '#d4e6a0', '#a9d06b', '#7fb84f', '#5a9e45', '#3f8440', '#2e6b3a', '#245432', '#1b3f2a',
  '#8fb39a', '#4f7f6a',
  // water and blues
  '#bce9e4', '#80cecf', '#54aeb6', '#338b98', '#206577', '#164456', '#6fa0c9', '#3f6ea5',
  // clay, terracotta, reds
  '#f2b08a', '#e08a5c', '#c96b42', '#a8502f', '#7d3a24', '#ef6a52', '#d9503c', '#a8322c',
  // yellows and gold
  '#fff3a8', '#f5e050', '#e3c832', '#d0a82a', '#b08420', '#86601c', '#d8b878', '#a87b4a',
  // wood and browns
  '#b97d55', '#9c6440', '#71452e', '#62452f', '#463128', '#2c231e',
  // sandstone
  '#efe0b8', '#dcc890', '#c2aa70', '#9e8858',
  // violet shadows and accents
  '#e8c8e0', '#9d8cc0', '#6b5b8a', '#4a3f66',
];

export const PALETTE_RGB = PALETTE_HEX.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
});
