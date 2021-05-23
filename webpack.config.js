const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

//loaders--------------------------------------------------
const loaders = env => ({
  pug: {
    test: /\.pug$/,
    include: path.resolve(__dirname, 'src'),
    use: [
      {
        loader: 'pug-loader',
        options: {
          root: path.resolve(__dirname, 'src'),
        },
      },
    ],
  },
  sass: {
    test: /\.(css|sass|scss)$/i,
    include: path.resolve(__dirname, 'src'),
    use: [
      env.development
        ? 'style-loader'
        : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: env.development,
              reloadAll: true,
            },
          },
      {loader: 'css-loader', options: {sourceMap: env.development}},
      {loader: 'postcss-loader', options: {sourceMap: env.development}},
      {loader: 'resolve-url-loader'},
      {loader: 'sass-loader', options: {sourceMap: env.development}},
    ],
  },
  img: {
    test: /\.(png|svg|jpg|gif)$/,
    include: path.resolve(__dirname, 'src'),
    use: [
      'file-loader',
      {
        loader: 'image-webpack-loader',
        options: {
          bypassOnDebug: true,
          disable: false,
          optipng: {
            enabled: true,
          },
          mozjpeg: {
            progressive: true,
            quality: 65,
          },
          gifsicle: {
            interlaced: false,
          },
          webp: {
            quality: 75,
          },
        },
      },
    ],
  },
  fonts: {
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    include: path.resolve(__dirname, 'src'),
    use: ['file-loader'],
  },
  ts: {
    test: /\.ts?$/,
    loader: 'ts-loader',
    exclude: /node_modules/,
    options: {
      configFile: 'tsconfig.json',
      transpileOnly: true,
    },
  },
});

//optimization--------------------------------------------------
const optimization = env => {
  const config = {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };

  if (env.production) {
    config.minimize = true;
    config.removeEmptyChunks = true;
    config.mergeDuplicateChunks = true;
    config.minimizer = [
      new CssMinimizerPlugin({
        exclude: /node_modules/,
      }),
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          sourceMap: true,
          format: {
            comments: false,
          },
        },
      }),
    ];
  }
  return config;
};

module.exports = env => {
  return {
    mode: env.production ? 'production' : 'development',
    devtool: env.production ? false : 'eval-cheap-module-source-map',
    devServer: {
      contentBase: './dist',
      hot: true,
      compress: true,
      hot: env.development,
      port: 8080,
      open: true,
    },
    entry: {index: './src/index.ts'},
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
      }),
      new ForkTsCheckerWebpackPlugin({
        eslint: {
          files: './src/*.ts',
        },
      }),
      new MiniCssExtractPlugin({
        filename: env.production
          ? '[name]/style.css'
          : '[name].[contenthash].css',
      }),
      new HtmlWebpackPlugin({
        title: 'v-slider',
        filename: 'index.html',
        template: path.resolve(__dirname, 'src/index.pug'),
        minify: {
          removeComments: env.production,
          collapseWhiteSpace: env.production,
          removeRedundantAttributes: env.production,
          useShortDoctype: env.production,
        },
      }),
    ],
    module: {
      rules: [
      loaders(env).fonts,
      loaders(env).img,
      loaders(env).pug,
      loaders(env).sass,
      loaders(env).ts,
    ]},
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        root: path.resolve(__dirname, 'src/'),
      },
    },
    optimization: optimization(env),
  };
};
