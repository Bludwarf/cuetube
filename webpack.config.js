const path = require('path');

module.exports = {
  entry: "./src/index.ts",
  devServer: {
    contentBase: path.resolve(__dirname, "./client"),
    historyApiFallback: true,
    inline: true,
    open: true,
    hot: true
  },
  devtool: 'eval-source-map',//'inline-source-map'
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              //transpileOnly: true, // TODO : à retirer dès que TS corrigé
            }
          }
        ]
      }
    ]
  },
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, 'client/js')
  }
};