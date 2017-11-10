// Karma configuration
// Generated on Thu Jun 15 2017 12:18:26 GMT+0200 (Paris, Madrid (heure d’été))

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'/*, 'requirejs'*/],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/jquery/dist/jquery.js',

      // Angular
      'bower_components/angular/angular.min.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/moment/moment.js', // FIXME : Karma ne le trouve pas dans client/js !

      'client/js/*.js',
      'client/js/controllers/*.js',
      'test/**/*.js',

        // Resources JSON
        'bower_components/karma-read-json/karma-read-json.js',
        // JSON fixture
        { pattern:  'samples/**/*.json',
            watched:  true,
            served:   true,
            included: false },

      //'test-main.js'
    ],


    // list of files to exclude
    exclude: [
      'client/js/*.min.js',
      'client/js/app.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
