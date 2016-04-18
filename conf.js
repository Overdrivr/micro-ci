exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['./test/e2e/test_oauth_auth_github.js'],
  /*capabilities: {
    'browserName': 'phantomjs',
    'phantomjs.binary.path': require('phantomjs-prebuilt').path,
    'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG']
  }*/

};
