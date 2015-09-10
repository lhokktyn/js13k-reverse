module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: ["build/"],
            prezip: ["build/game.js", "build/levels.js"]
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: true
            },
            build: {
                files: {
                    'build/game.min.js': ['build/levels.js', 'build/game.js']
                }
            }
        },

        'string-replace': {
            options: {
                saveUnchanged: true
            },
            html: {
                options: {
                replacements: [{
                        pattern: /<\!\-\-START\-\->[\S\s]*<\!\-\-END\-\->/ig,
                        replacement: '<link rel="stylesheet" href="game.min.css" /><script src="game.min.js"></script>'
                    }, {
                        pattern: /[\r\n]/ig,
                        replacement: ''
                    }, {
                        pattern: /> +</ig,
                        replacement: '><'
                    }]
                },
                files: {
                    'build/game.html': ['game.html']
                }
            },
            js: {
                options: {
                replacements: [{
                        pattern: /(\/\*\-DEBUG:START\-\*\/)[\S\s]*?(\/\*\-DEBUG:END\-\*\/)/ig,
                        replacement: ''
                    }]
                },
                files: {
                    'build/': ['*.js', '!Gruntfile.js']
                }
            },
        },

        copy: {
            build: {
                files: {
                    'build/sprites.png': 'sprites.png',
                    'build/bg.jpg': 'bg.jpg'
                }
            }
        },

        cssmin: {
            build: {
                files: {
                    'build/game.min.css': 'game.css'
                }
            }
        },

        compress: {
            build: {
                options: {
                    archive: 'build.zip',
                    mode: 'zip',
                    level: 9
                },
                expand: true,
                cwd: 'build/',
                src: ['**/*'],
                dest: './'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['clean:build', 'string-replace:html', 'string-replace:js', 'uglify', 'cssmin', 'copy', 'clean:prezip', 'compress']);

};
