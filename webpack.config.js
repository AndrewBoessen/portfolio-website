const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
  },
  mode: "production",
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "webassembly/async"
      }
    ]
  },
  plugins: [
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '.'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "index.html" }  // Updated to use new CopyWebpackPlugin syntax
      ]
    })
  ]
};
