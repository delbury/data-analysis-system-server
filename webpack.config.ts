import { webpack, Configuration, ProgressPlugin } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

const config: Configuration = {
  mode: 'production',
  target: 'node',
  entry: './src/app.ts',
  output: {
    path: path.resolve(__dirname, './output'),
    filename: 'app.js',
    clean: true,
  },
  module: {
    rules: [
      { test: /\.ts?$/, loader: 'ts-loader' },
    ],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '~types': path.resolve(__dirname, './types'),
      '~tables': path.resolve(__dirname, './src/db/tables'),
      '~libs': path.resolve(__dirname, './libs'),
    },
    extensions: ['.ts', '.js', '.json'],
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
          mangle: false,
        },
      }),
    ],
  },
  plugins: [
    new ProgressPlugin({}),
  ],
};

export default config;
