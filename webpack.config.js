const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
    webassemblyModuleFilename: "[hash].wasm",
    publicPath: '/'
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
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
      crateDirectory: path.resolve(__dirname, 'rust'),
      extraArgs: '--target bundler',
      forceMode: "development"
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "index.html" }  // Updated to use new CopyWebpackPlugin syntax
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.wasm'],
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  }
};
