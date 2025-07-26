const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
    publicPath: "./",  // Ensure assets are referenced relative to the root
  },
  mode: "production",
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "webassembly/async",  // Enables async loading of the wasm file
      },
    ],
  },
  plugins: [
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '.'),  // Set the crate directory for the Rust code
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "index.html", to: "index.html" },  // Copy the index.html file into dist
        { from: "style.css", to: "style.css" },
        { from: "static", to: "static" },
      ],
    }),
  ],
};

