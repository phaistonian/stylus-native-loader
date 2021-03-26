"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getOptions = getOptions;
exports.isObject = isObject;
exports.castArray = castArray;
exports.getAliasList = getAliasList;
exports.resolveTildePath = resolveTildePath;

var _path = _interopRequireDefault(require("path"));

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