const chaiAsPromised = require('chai-as-promised');
const chai = require('chai').use(chaiAsPromised);

const expect = chai.expect;

const loadModifiers = require('./load-modifiers');

loadModifiers.configure({
  path: process.cwd()
});

beforeEach(() => {
  loadModifiers.clearStack();
});

describe('loadModifiers module', () => {
  it('fails with empty handler conf', () => {
    const emptyHandlersConf = {};
    const result = loadModifiers.load(emptyHandlersConf);
    const expected = [
      'Err: No handlers provided'
    ];
    return expect(result).to.be.rejectedWith(expected);
  });

  it('fails loading a non-existent module', () => {
    const modifiersConf = {
      name: 'this-module-should-never-exist'
    };
    const expected = [
      'Err: No handlers provided',
      'Err: Could not load: "this-module-should-never-exist"'
    ];
    const result = loadModifiers.load(modifiersConf);
    return expect(result).to.be.rejectedWith(expected);
  });

  it('modifiersmods loaded from node_modules should contain: configure, ??Markconf??, meta & httpResponseModifier', () => {
    const modifiersConf = {
      markdown: 'markserv-mod-markdown'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('markdown.configure'),
      // expect(modifierStack).to.eventually.have.deep.property('markdown.Markconf'),
      expect(modifierStack).to.eventually.have.deep.property('markdown.meta'),
      expect(modifierStack).to.eventually.have.deep.property('markdown.httpResponseModifier')
    ]);
  });

  it('loads markserv-mod-dir modifier from: node_modules', () => {
    const modifiersConf = {
      dir: 'markserv-mod-dir'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('dir.meta.name', 'markserv-mod-dir')
    ]);
  });

  it('loads 2 handler processors from: node_modules', () => {
    const modifiersConf = {
      dir: 'markserv-mod-dir',
      markdown: 'markserv-mod-markdown'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('dir.meta.name', 'markserv-mod-dir'),
      expect(modifierStack).to.eventually.have.deep.property('markdown.meta.name', 'markserv-mod-markdown')
    ]);
  });

  it('loads handler processor from: local module script directory', () => {
    const modifiersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('local.meta.name', 'markserv-mod-local')
    ]);
  });

  it('mods loaded from local should contain: configure, ??Markconf??, meta & httpResponseModifier', () => {
    const modifiersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('local.configure'),
      // expect(modifierStack).to.eventually.have.deep.property('local.Markconf'),
      expect(modifierStack).to.eventually.have.deep.property('local.meta'),
      expect(modifierStack).to.eventually.have.deep.property('local.httpResponseModifier')
    ]);
  });

  it('loads handler processor from: local module script .js file', () => {
    const modifiersConf = {
      local: 'core/spec/mock/modules/markserv-mod-local/index'
    };
    const modifierStack = loadModifiers.load(modifiersConf);
    return Promise.all([
      expect(modifierStack).to.eventually.have.deep.property('local.meta.name', 'index')
    ]);
  });

  it('can clear the loaded stack', () => {
    const modifiersConf = {
      dir: 'markserv-mod-dir'
    };
    const expected = {};
    const modifierStack = loadModifiers.load(modifiersConf).then(() => {
      loadModifiers.clearStack();
      return loadModifiers.stack;
    });
    return expect(modifierStack).to.become(expected);
  });
});
