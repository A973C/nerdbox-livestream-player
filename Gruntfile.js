module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: [{
                    expand: true,
                    cwd: 'scss',
                    src: ['*.scss'],
                    dest: 'css',
                    ext: '.css'
                }]
            }
        },
        autoprefixer: {
            options: {
                browsers: ['> 5%', '> 1% in FR', 'last 5 versions', 'last 2 IE versions']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'css',
                    src: ['*.css'],
                    dest: 'css',
                    ext: '.css'
                }]
            }
        },
        cssmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'css',
                    src: ['*.css'],
                    dest: 'css',
                    ext: '.min.css'
                }]
            }
        },
        watch: {
            css: {
                files: 'scss/*.scss',
                tasks: ['sass', 'autoprefixer']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.registerTask('default', ['sass', 'autoprefixer', 'watch']);
    grunt.registerTask('compile', ['sass', 'autoprefixer']);
};