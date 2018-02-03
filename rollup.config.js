var nodeResolve = require('rollup-plugin-node-resolve'),
    commonjs = require('rollup-plugin-commonjs'),
    uglify = require('rollup-plugin-uglify'),
    eslint = require('rollup-plugin-eslint'),
    babel = require('rollup-plugin-babel'),
    json = require('rollup-plugin-json'),
    glslify = require('glslify');

const glsl = () => {
  return {
    transform( code, id ) {
      if ( !/\.glsl$|\.vert$|\.frag$/.test( id ) ) return;
      const res = glslify( code );
      return 'export default ' + JSON.stringify(
        res
        .replace( /[ \t]*\/\/.*\n/g, '' )
        .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )
        .replace( /\n{2,}/g, '\n' )
      ) + ';\n';
    },
  };
};

export default {
  input: 'src/index.js',
  context: 'window',
  useStrict: false,
  output: {
    format: 'iife',
    name: 'template',
    file: 'template.js'
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    glsl(),
    json(),
    eslint({
      exclude: [
        'three_modules/**',
        'src/shaders/*'
      ]
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    uglify()
  ]
};
