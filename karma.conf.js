// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-firefox-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage'),
            require('@angular-devkit/build-angular/plugins/karma'),
        ],
        browsers: ['FirefoxHeadless'],
        files: [
            {
                pattern: "./node_modules/jquery/dist/jquery.min.js",
                watched: true
            },
            {
                pattern: 'src/test/assets/als/*.als',
                included: false,
                watched: false,
                served: true,
            },
            {
                pattern: 'src/test/assets/zip/*.zip',
                included: false,
                watched: false,
                served: true,
            },
        ],
    });
};
