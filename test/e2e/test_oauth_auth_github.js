var parse = require('url-parse');
var credentials = require('./test-credentials.json').github;

var baseurl = 'http://127.0.0.1:3000';

describe('Signup to micro-ci using Github', function() {
  it('should execute the oauth2.0 flow', function() {

    browser.driver.get(baseurl + '/login');
    browser.driver.findElement(by.css('#login-github')).click();

    // Check redirection to github
    // See http://stackoverflow.com/questions/29952764/protractor-get-url-of-not-angular-page
    browser.ignoreSynchronization = true;
    expect(browser.getCurrentUrl()).toContain('https://github.com/');
    browser.ignoreSynchronization = false;

    // Authenticate
    browser.driver.findElement(by.css('#login_field')).sendKeys(credentials.username);
    browser.driver.findElement(by.css('#password')).sendKeys(credentials.password);
    browser.driver.findElement(by.css('input[name="commit"]')).click();

    // Check if redirected already or not
    browser.ignoreSynchronization = true;
    var url = parse(browser.getCurrentUrl());
    browser.ignoreSynchronization = false;

    if(url.hostame == "github.com")
    {
      // Account did not authorize micro-ci yet. Do it now.
      browser.driver.findElement(by.css('button[type="submit"]')).click();
    }

    // Check we are properly redirected back to micro-ci
    browser.ignoreSynchronization = true;
    url = browser.getCurrentUrl();
    expect(url).toContain(baseurl);
    browser.ignoreSynchronization = false;
  });
});
