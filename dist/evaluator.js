"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getAliasEvaluator;

var _path = _interopRequireDefault(require("path"));

var _evaluator = _interopRequireDefault(require("stylus/lib/visitor/evaluator"));

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {Object} context
 * @param {Object|false} aliases
 * @param {boolean} resolveTilde
 *
 * @returns {Function<AliasEvaluator>|boolean}
 */
function getAliasEvaluator(context, aliases, resolveTilde) {
  let aliasList = null;

  function resolveAlias(importPath) {
    const firstChar = importPath[0];

    if (aliases) {
      if (firstChar === '.' || firstChar === '/' || _path.default.isAbsolute(importPath)) {
        return importPath;
      }

      if (aliasList === null) {
        aliasList = (0, _util.getAliasList)(aliases);
      }

      for (const entry of aliasList) {
        if (entry.alias === importPath) {
          return entry.path;
        } else if (!entry.exact && importPath.indexOf(entry.aliasRoot) === 0) {
          return _path.default.resolve(entry.path, importPath.slice(entry.aliasRoot.length));
        }
      }
    }

    if (resolveTilde && firstChar === '~') {
      return (0, _util.resolveTildePath)(importPath);
    }

    return importPath;
  }

  return class AliasEvaluator extends _evaluator.default {
    visitImport(imported) {
      const node = this.visit(imported.path).first;

      if (typeof node.string === 'string' && node.string !== '') {
        node.string = resolveAlias(node.string);
      }

      return super.visitImport(imported);
    }

  };
}