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
    'goog:chromeOptions': {
      'args': [
        'headless',
        'no-sandbox',
        'disable-gpu',
        'disable-dev-shm-usage'
      ]
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
        'aria-required-children': {enabled: false}, // role=combobox
        'color-contrast': {enabled: false}, // input[disabled] can fail color contrast (SC 1.4.1)
        'data-table': {enabled: false}, // 
      } 
    },
    package: 'protractor-accessibility-plugin'
  }]
};