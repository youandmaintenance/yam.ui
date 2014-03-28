module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    indent: {
      files: {
        src: ['tmp/*.js'],
        dest: 'tmp/indent/',
      },
      options: {
        style: 'space',
        size: 2,
        change: 1,
      }
    },
    concat: {
      dist: {
        src: [
          'src/head',
          'tmp/indent/yam-ui.js',
          'src/bottom'
        ],
        dest: 'dist/yam-ui.js',
      },
      tmp: {
        src: [
          'src/directives/utils.js',
          'src/directives/inputs.js',
          'src/directives/select.js',
          'src/directives/forms.js',
          'src/directives/tabs.js',
          'src/module.js',
        ],
        dest: 'tmp/yam-ui.js',
        options: {
          // Replace all 'use strict' statements in the code with a single one at the top
          process: function (src, filepath) {
            if (filepath == 'src/head') {
              console.log(src);
              return src.replace(/^\s/, '');
            }
            if (filepath == 'src/bottom') {
              return src.replace(/^\s+/, '');
            }
            return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          },
        }
      }
    },
    uglify: {
      options: {
        mangle: true
      },
      build: {
        files: {
          'dist/yam-ui.min.js' : ['dist/yam-ui.js']
        }
      }
    },
    clean: ['tmp/']
  });

  grunt.loadNpmTasks('grunt-indent');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('build', ['concat:tmp', 'indent', 'concat:dist', 'uglify', 'clean']);
  grunt.registerTask('default', ['build']);

};
