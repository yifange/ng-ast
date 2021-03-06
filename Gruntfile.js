/* global module */
module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    'nice-package': {
      all: {
        options: {
          blankLine: true
        }
      }
    },

    jshint: {
      'options': {
        jshintrc: '.jshintrc'
      },
      default: {
        'src': [ '*.js', 'test/*.js' ]
      }
    },

    sync: {
      all: {
        options: {
          sync: ['author', 'name', 'version',
            'private', 'license', 'keywords', 'homepage'],
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/*-spec.js']
      }
    },

    watch: {
      options: {
        atBegin: true
      },
      all: {
        files: ['*.js', 'test/*.js', 'package.json'],
        tasks: ['jshint', 'test']
      }
    },

    'clean-console': {
      all: {
        options: {
          url: 'index.html',
          timeout: 2 // seconds to wait for any errors
        }
      }
    },

    xplain: {
      examples: {
        options: {
          output: 'README.md',
          framework: 'jasmine'
        },
        src: ['test/examples-spec.js']
      }
    }
  });

  var plugins = module.require('matchdep').filterDev('grunt-*');
  plugins.forEach(grunt.loadNpmTasks);

  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('default', ['deps-ok', 'nice-package', 'sync', 'test', 'clean-console']);
};
