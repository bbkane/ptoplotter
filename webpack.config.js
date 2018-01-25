const path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // https://stackoverflow.com/a/33374807/2958070
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/static' }
    ])
  ],
  // From the README
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'ify-loader'
      }
    ]
  },
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};

