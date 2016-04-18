var parse = require('url-parse');
var credentials = require('./test-credentials.json').github;

describe('Signup to micro-ci using Github', function() {
  it('should execute the oauth2.0 flow', function() {

    browser.driver.get('http://localhost:3000/login');
    browser.driver.findElement(by.css('#login-github')).click();

    // See http://stackoverflow.com/questions/29952764/protractor-get-url-of-not-angular-page
    browser.ignoreSynchronization = true;
    expect(browser.getCurrentUrl()).toContain('https://github.com/');
    browser.ignoreSynchronization = false;

    browser.driver.findElement(by.css('#login_field')).sendKeys(credentials.username);
    browser.driver.findElement(by.css('#password')).sendKeys(credentials.password);
    browser.driver.findElement(by.css('input[name="commit"]')).click();

    browser.ignoreSynchronization = true;
    var url = parse(browser.getCurrentUrl());
    browser.ignoreSynchronization = false;

    if(url.hostame == "github.com")
    {
      // Account did not authorize micro-ci yet
      browser.driver.findElement(by.css('button[type="submit"]')).click();
    }

    // Back to micro-ci
    browser.ignoreSynchronization = true;
    expect(browser.getCurrentUrl()).toContain('http://127.0.0.1:3000');
    browser.ignoreSynchronization = false;

  });
});
