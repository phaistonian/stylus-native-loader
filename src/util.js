import path from 'path'
import { parse } from 'url';
import { Compiler, nodes, utils } from 'stylus';


/**
 * @param {Object} context The loader context
 *
 * @return {Object}
 */
export function getOptions(context) {
	if (typeof context.getOptions === 'function') {
		return context.getOptions()
	} else {
		return require('loader-utils').getOptions(context)
	}
}

/**
 * @return {boolean}
 */
export function isObject(value) {
	return typeof value === 'object' && value !== null
}

/**
 * @return {Array}
 */
export function castArray(value) {
	if (value == null) {
		return []
	} else if (Array.isArray(value)) {
		return value
	} else {
		return [value]
	}
}

/**
 * @param {Object} aliases
 *
 * @return {Array}
 */
export function getAliasList(aliases) {
	const aliasList = []

	if (typeof aliases !== 'object') {
		return aliasList
	}

	for (let [alias, aliasPath] of Object.entries(aliases)) {
		let exact = false

		if (alias.slice(-1) === '$') {
			exact = true
			alias = alias.slice(0, -1)
		}

		aliasList.push({
			alias,
			aliasRoot: alias + '/',
			path: aliasPath.replace(/[/\\]+$/, ''),
			exact,
		})
	}

	return aliasList
}

/**
 * @param {string} importPath
 *
 * @return {string}
 */
export function resolveTildePath(importPath) {
	const target = importPath.slice(1)
	const resolved = require.resolve(target)
	const nodeModulesPos = resolved.lastIndexOf(path.sep + 'node_modules' + path.sep)

	if (nodeModulesPos !== -1) {
		return path.resolve(resolved.slice(0, nodeModulesPos), 'node_modules', target)
	} else {
		return path.dirname(resolved)
	}
}

export function urlResolver(options = {}) {
  function resolver(url) {
    const compiler = new Compiler(url);
    const { filename } = url;

    compiler.isURL = true;

    const visitedUrl = url.nodes.map((node) => compiler.visit(node)).join("");
    const splitted = visitedUrl.split("!");

    const parsedUrl = parse(splitted.pop());

    // Parse literal
    const literal = new nodes.Literal(`url("${parsedUrl.href}")`);
    let { pathname } = parsedUrl;
    let { dest } = this.options;
    let tail = "";
    let res;

    // Absolute or hash
    if (parsedUrl.protocol || !pathname || pathname[0] === "/") {
      return literal;
    }

    // Check that file exists
    if (!options.nocheck) {
      // eslint-disable-next-line no-underscore-dangle
      const _paths = options.paths || [];

      pathname = utils.lookup(pathname, _paths.concat(this.paths));

      if (!pathname) {
        return literal;
      }
    }

    if (this.includeCSS && path.extname(pathname) === ".css") {
      return new nodes.Literal(parsedUrl.href);
    }

    if (parsedUrl.search) {
      tail += parsedUrl.search;
    }

    if (parsedUrl.hash) {
      tail += parsedUrl.hash;
    }

    if (dest && path.extname(dest) === ".css") {
      dest = path.dirname(dest);
    }

    res =
      path.relative(
        dest || path.dirname(this.filename),
        options.nocheck ? path.join(path.dirname(filename), pathname) : pathname
      ) + tail;

    if (path.sep === "\\") {
      res = res.replace(/\\/g, "/");
    }

    splitted.push(res);

    return new nodes.Literal(`url("${splitted.join("!")}")`);
  }

  resolver.options = options;
  resolver.raw = true;

  return resolver;
}
