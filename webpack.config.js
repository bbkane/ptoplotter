const path = require('path');

module.exports = {
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

