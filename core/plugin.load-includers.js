const path = require('path');

let Markconf;

let globalStack = {};

const configure = conf => {
  Markconf = conf;
};

const loadNpmModule = modpath => {
  const activeModule = require(path.join(Markconf.path, 'node_modules', modpath));
  return activeModule;
};

const loadLocalModule = modpath => {
  const fullpath = Markconf.path + '/' + modpath;
  const activeModule = require(fullpath);
  return activeModule;
};

const fetchModule = (name, deps) => {
  return new Promise((resolve, reject) => {
    let activeModule;

    if (typeof deps === 'string') {
      try {
        activeModule = loadNpmModule(deps);
      } catch (err) {
        try {
          activeModule = loadLocalModule(deps);
        } catch (err) {
        }
      }
    }

    if (!activeModule) {
      return reject('Err: Could not load: "' + deps + '"');
    }

    resolve(activeModule);
  });
};

const countMembers = obj => {
  let count = 0;
  for (const member in obj) {
    if ({}.hasOwnProperty.call(obj, member)) {
      count += 1;
    }
  }

  return count;
};

const clearStack = () => {
  globalStack = {};
};

const load = includers => {
  return new Promise((resolve, reject) => {
    const includerCount = countMembers(includers);
    const loadStack = [];

    if (includerCount <= 0) {
      return reject(['Err: No includers provided']);
    }

    for (const name in includers) {
      if ({}.hasOwnProperty.call(includers, name)) {
        loadStack.push(fetchModule(name, includers[name]));
      }
    }

    Promise.all(loadStack).then(loadedModules => {
      const returnStack = {};

      let i = 0;
      let activeModule;

      for (const moduleName in includers) {
        if ({}.hasOwnProperty.call(includers, moduleName)) {
          activeModule = loadedModules[i];
          i += 1;

          returnStack[moduleName] = activeModule;
          globalStack[moduleName] = activeModule;
        }
      }

      resolve(returnStack);
    })
    .catch(err => {
      // console.log(err);
      return reject(['Err: Includer could not be loaded'].concat(err));
    });
  });
};

module.exports = {
  configure,
  stack: globalStack,
  load,
  clearStack
};