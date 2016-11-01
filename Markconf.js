const Markconf = {
  title: 'Markconf Example',

  // serverRoot: 'some-pre-defined-path',

  // defaults: {
  //   fileTypes: {
  //     markdown: [
  //      '.md'
  //    ]
  //   }
  // }

  watch: {
    Markconf: true,
    modifiers: true,
    includers: true,
    templates: true,
    paths: true
  },

  // File includers
  includers: {
    // html: 'markserv-contrib-inc.html',
    // markdown: 'markserv-contrib-inc.markdown',
    // less: 'markserv-contrib-inc.less'
  },

  // HTTP Response Modifiers
  modifiers: {
    core: 'markserv-contrib-app.github'
    // core: {
    //   directory: 'markserv-contrib-mod.dir',
    //   markdown: 'markserv-contrib-mod.markdown',
    //   http404: 'markserv-contrib-mod.http-404',
    //   file: 'markserv-contrib-mod.file'
    // }

    // path: {
    //   // 'tests/posts/**/*.md': 'markserv-mod-post'
    // }
  },

  rewrites: {
    'test/redirect-a/**/*': 'test/redirect-b/**/*'
  }
};

module.exports = Markconf;
