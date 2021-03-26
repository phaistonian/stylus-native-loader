"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = stylusLoader;

var _path = _interopRequireWildcard(require("path"));

var _fs = require("fs");

var _stylus = _interopRequireDefault(require("stylus"));

var _evaluator = _interopRequireDefault(require("./evaluator"));

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function stylusLoader(source) {
  const callback = this.async(); // get options passed to loader

  const loaderOptions = (0, _util.getOptions)(this); // clone loader options to avoid modifying this.query

  const options = loaderOptions ? { ...loaderOptions
  } : {}; // access Webpack config

  const webpackConfig = this._compilation && (0, _util.isObject)(this._compilation.options) ? this._compilation.options : {}; // stylus works better with an absolute filename

  options.filename = options.filename || this.resourcePath; // get sourcemap option in the order: options.sourceMap > options.sourcemap > this.sourceMap

  if (options.sourceMap != null) {
    options.sourcemap = options.sourceMap;
  } else if (options.sourcemap == null && this.sourceMap && (!webpackConfig.devtool || webpackConfig.devtool.indexOf('eval') !== 0)) {
    options.sourcemap = {};
  } // set stylus sourcemap defaults


  if (options.sourcemap) {
    if (!(0, _util.isObject)(options.sourcemap)) {
      options.sourcemap = {};
    }

    options.sourcemap = Object.assign({
      // enable loading source map content by default
      content: true,
      // source map comment is added by css-loader
      comment: false,
      // set sourceRoot for better handling of paths by css-loader
      sourceRoot: this.rootContext
    }, options.sourcemap);
  } // create stylus renderer instance


  const styl = (0, _stylus.default)(source, options); // disable all built-in vendor prefixes by default (prefer autoprefixer)

  if (options.vendors !== true) {
    styl.import(_path.default.join(__dirname, '../lib/vendors-official.styl'));
  } // import of plugins passed as strings


  if (options.use.length) {
    for (const [i, plugin] of Object.entries(options.use)) {
      if (typeof plugin === 'string') {
        try {
          options.use[i] = require(plugin)();
        } catch (err) {
          options.use.splice(i, 1);
          err.message = `Stylus plugin '${plugin}' failed to load. Are you sure it's installed?`;
          this.emitWarning(err);
        }
      }
    }
  } // add custom include paths


  if ('include' in options) {
    (0, _util.castArray)(options.include).forEach(styl.include, styl);
  } // add custom stylus file imports


  if ('import' in options) {
    (0, _util.castArray)(options.import).forEach(styl.import, styl);
  } // enable resolver for relative urls


  if (options.resolveUrl) {
    if (!(0, _util.isObject)(options.resolveUrl)) {
      options.resolveUrl = {};
    } // styl.define('url',stylus.resolver(options.resolveUrl))


    styl.define('url', (0, _util.urlResolver)(options.resolveUrl));
  } // define global variables/functions


  if ((0, _util.isObject)(options.define)) {
    const raw = options.defineRaw == null ? true : options.defineRaw;

    for (const entry of Object.entries(options.define)) {
      styl.define(...entry, raw);
    }
  } // include regular CSS on @import


  if (options.includeCSS) {
    styl.set('include css', true);
  } // resolve webpack aliases using a custom evaluator


  let aliases = 'alias' in options ? options.alias : webpackConfig.resolve.alias;
  const resolveTilde = 'resolveTilde' in options ? options.resolveTilde : true;

  if (typeof aliases !== 'object' || !Object.keys(aliases).length) {
    aliases = false;
  }

  if (aliases || resolveTilde) {
    styl.set('Evaluator', (0, _evaluator.default)(this, aliases, resolveTilde));
  } // keep track of imported files (used by Stylus CLI watch mode)


  options._imports = []; // trigger callback before compiling

  if (typeof options.beforeCompile === 'function') {
    options.beforeCompile(styl, this, options);
  } // let stylus do its magic


  styl.render(async (err, css) => {
    if (err) {
      if (err.filename) {
        this.addDependency(err.filename);
      }

      return callback(err);
    }

    const watchingDirs = {}; // add all source files as dependencies

    if (options._imports.length) {
      for (const importData of options._imports) {
        if (!importData || !importData.path) {
          continue;
        }

        this.addDependency(importData.path);

        if (options.watchDirs !== false) {
          const dir = _path.default.dirname(importData.path);

          if (!(dir in watchingDirs)) {
            this.addContextDependency(dir);
            watchingDirs[dir] = true;
          }
        }
      }
    }

    if (styl.sourcemap) {
      // css-loader will set the source map file name
      delete styl.sourcemap.file; // load source file contents into source map

      if (options.sourcemap && options.sourcemap.content) {
        try {
          styl.sourcemap.sourcesContent = await Promise.all(styl.sourcemap.sources.map(file => _fs.promises.readFile(file, 'utf-8')));
        } catch (e) {
          return callback(e);
        }
      }
    } // profit!


    callback(null, css, styl.sourcemap);
  });
}