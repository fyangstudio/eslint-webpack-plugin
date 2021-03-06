import { statSync } from 'fs';

import arrify from 'arrify';

const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g;

/**
 * @param {string|string[]} files
 * @param {string} context
 * @returns {string[]}
 */
export function parseFiles(files, context) {
  return arrify(files).map(
    (file) =>
      `${replaceBackslashes(context).replace(
        UNESCAPED_GLOB_SYMBOLS_RE,
        '\\$2'
      )}/${replaceBackslashes(file)}`
  );
}

/**
 * @param {string} str
 * @returns {string}
 */
export function replaceBackslashes(str) {
  return str.replace(/\\/g, '/');
}

/**
 * @param {string|string[]} patterns
 * @param {string|string[]} extensions
 * @returns {string[]}
 */
export function parseFoldersToGlobs(patterns, extensions) {
  const extensionsList = arrify(extensions);
  const [prefix, postfix] = extensionsList.length > 1 ? ['{', '}'] : ['', ''];
  const extensionsGlob = extensionsList
    .map((extension) => extension.replace(/^\./u, ''))
    .join(',');

  return arrify(patterns)
    .map((pattern) => replaceBackslashes(pattern))
    .map((pattern) => {
      try {
        // The patterns are absolute because they are prepended with the context.
        const stats = statSync(pattern);
        /* istanbul ignore else */
        if (stats.isDirectory()) {
          return pattern.replace(
            /[/\\]+?$/u,
            `/**/*.${prefix + extensionsGlob + postfix}`
          );
        }
      } catch (_) {
        // Return the pattern as is on error.
      }
      return pattern;
    });
}
