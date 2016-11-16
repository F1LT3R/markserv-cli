const path = require('path');

const Promise = require('bluebird');
const cheerio = require('cheerio');

const helpFs = require('./help.fs');
const log = require('./core.logger');

let Markconf;

const configure = conf => {
  Markconf = conf;
  log.trace('Template compiler recived a new Markconf configuration.');
};

const isComment = node => {
  if ({}.hasOwnProperty.call(node, 'type') === false) {
    return false;
  }

  return node.type === 'comment';
};

const getCommentIsMarkserv = node => {
  return node.data
    .slice(0, node.data.indexOf('|'))
    .replace(/\s+/g, '')
    .toLowerCase();
};

const unpackCommentData = node => {
  const parts = node.data.split('|');

  const data = {};

  if ({}.hasOwnProperty.call(parts, 1)) {
    data.includer = parts[1];
  }

  if ({}.hasOwnProperty.call(parts, 2)) {
    data.filename = path.basename(parts[2]);
    data.dirname = path.dirname(parts[2]);
  }

  if ({}.hasOwnProperty.call(parts, 3)) {
    data.params = parts[3];
  }

  return data;
};

const compileTemplate = templateFilepath => {
  let $DOM;

  const processNode = (node, include, dir) => {
    return new Promise((resolve, reject) => {
      const filepath = path.join(dir, include.dirname, include.filename);

      module.exports.compileTemplate(filepath).then(content => {
        const $content = cheerio.load(content)._root;
        $DOM(node).replaceWith($content);
        resolve(node);
      }).catch(err => {
        reject(err);
      });
    });
  };

  const filter = (node, dir) => {
    return new Promise((resolve, reject) => {

      if (typeof node !== 'object' || {}.hasOwnProperty.call(node, 'children') === false) {
        return resolve(node);
      }

      const promiseStack = [];

      node.childNodes.forEach(childNode => {
        const include = isComment(childNode) &&
          getCommentIsMarkserv(childNode) &&
          unpackCommentData(childNode, dir);

        if (include) {
          promiseStack.push(processNode(childNode, include, dir));
        } else {
          promiseStack.push(filter(childNode, dir));
        }
      });

      if (promiseStack.length === 0) {
        return resolve(node);
      }

      Promise.all(promiseStack).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  };

  return new Promise((resolve, reject) => {
    log.trace(`Compiling template: ${log.ul(templateFilepath)}`);
    helpFs.readfile(templateFilepath)
    .then(html => {
      $DOM = cheerio.load(html);

      const $rootElem = $DOM._root;
      const templateRoot = path.dirname(templateFilepath);

      filter($rootElem, templateRoot).then(() => {
        const htmlOutput = $DOM.html();
        resolve(htmlOutput);
      }).catch(err => {
        console.log(err);
        log.error(err);
        reject(err);
      });
    })
    .catch(err => {
      reject(err);
    });
  });
};

module.exports = {
  configure,
  compileTemplate
};