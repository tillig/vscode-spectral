/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

'use strict';

const path = require('path');
const merge = require('merge-options');

module.exports = function withDefaults(/**@type WebpackConfig*/extConfig) {

  /** @type WebpackConfig */
  let defaultConfig = {
    mode: 'none',
    target: 'node',
    node: {
      __dirname: false
    },
    resolve: {
      mainFields: ['module', 'main'],
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [{
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          // configure TypeScript loader:
          // * enable sources maps for end-to-end source maps
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              "sourceMap": true,
            }
          }
        }]
      }]
    },
    externals: {
      'vscode': 'commonjs vscode',
    },
    output: {
      filename: '[name].js',
      path: path.join(extConfig.context, 'out'),
      libraryTarget: "commonjs",
    },
    devtool: 'source-map'
  };

  return merge(defaultConfig, extConfig);
};
