const path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  // https://stackoverflow.com/a/33374807/2958070
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/static' }
    ]),
    // new UglifyJSPlugin()  // TODO: this takes a while so guard it behind https://stackoverflow.com/a/31228568/2958070
  ],
  // From the README
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'ify-loader'
      }
    ],
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};

