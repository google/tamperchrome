// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './src/**/*.e2e-spec.ts'
  ],
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': ['enable-blink-features=AccessibilityObjectModel']
    }
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.json')
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: 'pretty' } }));
  },
  plugins: [{
    axe: {
      rules: {
        // Disable some rules until axe is upgraded
        'aria-allowed-attr': {enabled: false}, // rowcount/rowindex are allowed on role=grid/row
        'aria-required-children': {enabled: false},
      } 
    },
    package: 'protractor-accessibility-plugin'
  }]
};