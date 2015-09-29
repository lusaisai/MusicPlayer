module.exports = function(grunt) {

	grunt.initConfig({
		jshint: {
			build: ['Gruntfile.js', 'app/*.js']
		},
		uglify: {
			build: {
				files: {
					'dist/music.min.js': 'app/music.js'
				}
			}
		},
		cssmin: {
			build: {
				files: {
					'dist/music.min.css': 'app/music.css'
				}
			}
		},
		htmlmin: {
			options: {                                 // Target options
		        removeComments: true,
		        collapseWhitespace: true
		    },
			build: {
				files: {
					'dist/index.html': 'dist/index.production.html'
				}
			}
		}
	});

	grunt.registerTask('copyindex', 'copy index to dist and point resources to oss', function() {
		var data = grunt.file.read("index.html");
		var host = "http://im633-resources.oss-cn-shenzhen.aliyuncs.com/assets/MusicPlayer/vendor/";
		data = data.replace(/vendor\//g, host);
		data = data.replace(/app\/music/g, 'music.min');
		grunt.file.write("dist/index.production.html", data);
	});

	grunt.registerTask('removeindex', 'delet index.production.html', function() {
		grunt.file.delete("dist/index.production.html");
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.registerTask('default', ['jshint', 'uglify', 'cssmin', 'copyindex', 'htmlmin', 'removeindex']);
	
};
