const Markconf = {
	import: 'markserv-contrib-app.github',

	includers: {
		html: 'markserv-contrib-inc.html',
	// 	markdown: 'markserv-contrib-inc.markdown',
	// 	less: 'markserv-contrib-inc.less'
	},

	modifiers: {
		'**/': {
			module: '@import',
			// templateUrl: 'partials/test.html',
		},
		// '**/*.html': 'markserv-contrib-mod.html',
		// '**/*.md': 'markserv-contrib-mod.markdown',
		// '**/*': 'markserv-contrib-mod.file',
		// 404: 'markserv-contrib-mod.http-404'
	}

	// watch: {
	//   Markconf: true,
	//   modifiers: true,
	//   includers: true,
	//   templates: true,
	//   paths: true
	// },
};

module.exports = Markconf;
