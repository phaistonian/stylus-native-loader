"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOptions = getOptions;
exports.isObject = isObject;
exports.castArray = castArray;
exports.getAliasList = getAliasList;
exports.resolveTildePath = resolveTildePath;
exports.urlResolver = urlResolver;

var _path = _interopRequireDefault(require("path"));

var _url = require("url");

var _stylus = require("stylus");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {Object} context The loader context
 *
 * @return {Object}
 */
function getOptions(context) {
  if (typeof context.getOptions === 'function') {
    return context.getOptions();
  } else {
    return require('loader-utils').getOptions(context);
  }
}
/**
 * @return {boolean}
 */


function isObject(value) {
  return typeof value === 'object' && value !== null;
}
/**
 * @return {Array}
 */


function castArray(value) {
  if (value == null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}
/**
 * @param {Object} aliases
 *
 * @return {Array}
 */


function getAliasList(aliases) {
  const aliasList = [];

  if (typeof aliases !== 'object') {
    return aliasList;
  }

  for (let [alias, aliasPath] of Object.entries(aliases)) {
    let exact = false;

    if (alias.slice(-1) === '$') {
      exact = true;
      alias = alias.slice(0, -1);
    }

    aliasList.push({
      alias,
      aliasRoot: alias + '/',
      path: aliasPath.replace(/[/\\]+$/, ''),
      exact
    });
  }

  return aliasList;
}
/**
 * @param {string} importPath
 *
 * @return {string}
 */


function resolveTildePath(importPath) {
  const target = importPath.slice(1);

  const resolved = require.resolve(target);

  const nodeModulesPos = resolved.lastIndexOf(_path.default.sep + 'node_modules' + _path.default.sep);

  if (nodeModulesPos !== -1) {
    return _path.default.resolve(resolved.slice(0, nodeModulesPos), 'node_modules', target);
  } else {
    return _path.default.dirname(resolved);
  }
}

function urlResolver(options = {}) {
  function resolver(url) {
    const compiler = new _stylus.Compiler(url);
    const {
      filename
    } = url;
    compiler.isURL = true;
    const visitedUrl = url.nodes.map(node => compiler.visit(node)).join("");
    const splitted = visitedUrl.split("!");
    const parsedUrl = (0, _url.parse)(splitted.pop()); // Parse literal

    const literal = new _stylus.nodes.Literal(`url("${parsedUrl.href}")`);
    let {
      pathname
    } = parsedUrl;
    let {
      dest
    } = this.options;
    let tail = "";
    let res; // Absolute or hash

    if (parsedUrl.protocol || !pathname || pathname[0] === "/") {
      return literal;
    } // Check that file exists


    if (!options.nocheck) {
      // eslint-disable-next-line no-underscore-dangle
      const _paths = options.paths || [];

      pathname = _stylus.utils.lookup(pathname, _paths.concat(this.paths));

      if (!pathname) {
        return literal;
      }
    }

    if (this.includeCSS && _path.default.extname(pathname) === ".css") {
      return new _stylus.nodes.Literal(parsedUrl.href);
    }

    if (parsedUrl.search) {
      tail += parsedUrl.search;
    }

    if (parsedUrl.hash) {
      tail += parsedUrl.hash;
    }

    if (dest && _path.default.extname(dest) === ".css") {
      dest = _path.default.dirname(dest);
    }

    res = _path.default.relative(dest || _path.default.dirname(this.filename), options.nocheck ? _path.default.join(_path.default.dirname(filename), pathname) : pathname) + tail;

    if (_path.default.sep === "\\") {
      res = res.replace(/\\/g, "/");
    }

    splitted.push(res);
    return new _stylus.nodes.Literal(`url("${splitted.join("!")}")`);
  }

  resolver.options = options;
  resolver.raw = true;
  return resolver;
}