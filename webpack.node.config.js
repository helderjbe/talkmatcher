const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = () => {
  return {
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },
    mode: 'production',
    externals: [nodeExternals()],
    entry: [
      './src/server/server.js'
    ],
    output: {
      path: path.resolve(__dirname),
      filename: 'server.js',
    },
  };
};