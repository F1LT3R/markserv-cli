const path = require('path');

const log = require('app/lib/core/log');
const compiler = require('app/lib/http/compiler');
const registry = require('app/lib/plugin/register');
const modifier = require('app/lib/plugin/modifier');

const keyType = ref => {
	return Array.isArray(ref) ? '_array' : `_${typeof ref}`;
};

const resolver = {
	_function: elem => new Promise(resolve => {
		resolve(elem);
	}),

	_string: (name, type, key, def) => new Promise((resolve, reject) => {
		const pluginCb = require(name);

		// this could be handler by the plugin verifier in the future
		if (typeof pluginCb !== 'object') {
			return reject(`Plugin definition for ${log.ul(name)} was not returned as an object!`);
		}

		const plugin = registry.register(name, key, type);

		if (!def) {
			return resolve(plugin);
		}

		if (type === 'modifier') {
			return resolve(plugin);
		}
	}),

	_object: (item, type, key) => new Promise((resolve, reject) => {
		if ({}.hasOwnProperty.call(item, 'module') === false) {
			log.error(`Plugin object for ${log.hl(item)} should have a module property.`);
			return reject(false);
		}

		resolver._string(item.module, type, key, item).then(resolve).catch(reject);
	}),

	_array: (elem, type, key) => new Promise((resolve, reject) => {
		elem.map(item => {
			return resolver[type(item)](item, type, key);
		});

		Promise.all(elem).then(results => {
			resolve(results);
		}).catch(err => {
			reject(err);
		});
	})
};

const resolveConf = (conf, type) => new Promise((resolve, reject) => {
	const promises = [];

	Reflect.ownKeys(conf).forEach(key => {
		const elem = conf[key];
		promises.push(resolver[keyType(elem)](elem, type, key));
	});

	Promise.all(promises).then(results => {
		const liveConf = {};

		Reflect.ownKeys(conf).forEach((key, index) => {
			liveConf[key] = results[index];
		});

		resolve(liveConf);
	}).catch(err => {
		reject(err);
	});
});

const configureStack = (stack, Markconf) => new Promise((resolve, reject) => {
	const promises = [];

	for (const pluginName in stack) {
		if (!Reflect.has(stack, pluginName)) {
			continue;
		}

		log.trace(`Configuring plugin: ${log.hl(pluginName)}`);

		const plugin = stack[pluginName];
		const definitionType = Array.isArray(plugin) ? 'array' : 'object';

		if (definitionType === 'object') {
			promises.push(plugin.configure(Markconf));
		} else if (definitionType === 'array') {
			for (const subPlug of plugin) {
				promises.push(subPlug.configure(Markconf));
			}
		}
	}

	Promise.all(promises).then(() => {
		resolve();
	}).catch(err => {
		reject(err);
	});
});

const configurePlugins = (Markconf, plugins, type) => new Promise((resolve, reject) => {
	log.trace('Markserv is configuring plugins....');

	if (!plugins) {
		const warn = 'No plugins were found to configure.';
		log.warn(warn);
		return reject(warn);
	}

	if ({}.hasOwnProperty.call(plugins, type) === false) {
		const err = 'No ' + log.hl(type) + ' plugins were found to configure.';
		log.warn(err);
		return reject(err);
	}

	const stack = plugins[type];

	if (Reflect.ownKeys(stack).length > 0) {
		configureStack(stack, Markconf, type)
		.then(resolve)
		.catch(reject);
		return;
	}

	const fatal = 'No ' + log.hl('modifier') + ' plugins were found to configure.';
	log.fatal(fatal);
	reject(fatal);
});

const configureIncluders = (Markconf, includerStack) => {
	const includers = {includers: includerStack};
	return configurePlugins(Markconf, includers, 'includers');
};

const configureModifiers = (Markconf, modifierStack) => {
	const modifiers = {includers: modifierStack};
	return configurePlugins(Markconf, modifiers, 'modifiers');
};

module.exports = (confPath, conf) => new Promise((resolve, reject) => {
	registry.configure(conf);

	const providedPath = confPath.split('Markconf.js')[0];
	const confDir = path.resolve(providedPath);
	const confFile = path.resolve(path.join(confDir, 'Markconf.js'));
	log.trace('Resolving Markconf for path: ' + log.ul(confFile));

	let error;
	let Markconf;

	try {
		Markconf = require(confFile);
	} catch (err) {
		error = err;
		Markconf = false;
	}

	if (Markconf) {
		log.trace('Markconf ' + log.ul(confFile) + ' loaded successfully.');
		log.trace(Markconf);

		const incPromises = [];

		if ({}.hasOwnProperty.call(Markconf, 'includers')) {
			incPromises.push(resolveConf(Markconf.includers, 'includer'));
		}

		Promise.all(incPromises).then(plugins => {
			const components = {};

			const includers = plugins[0];

			if (includers.length > 0) {
				configureIncluders(Markconf, includers).then(() => {
					components.includers = includers;
					compiler.configure(Markconf, components.includers);
					modifier.configure(compiler);

					if ({}.hasOwnProperty.call(Markconf, 'modifiers')) {
						modPromises.push(resolveConf(Markconf.modifiers, 'modifier'));
					}

					Promise.all(modPromises).then(plugins => {
						const modifiers = plugins[-];
					});


					configureIncluders(Markconf, includers).then(() => {
						components.modifiers = modifiers;
						resolve(components);
					}).catch(reject);
				}).catch(reject);
			} else {
				compiler.configure(Markconf, null);
				configureIncluders(Markconf, includers).then(() => {
					components.modifiers = modifiers;
					resolve(components);
				}).catch(reject);
			}
		}).catch(err => {
			reject(err);
		});

		return;
	}

	log.error('Markconf ' + log.ul(confFile) + ' could not be loaded!');
	return error;
});