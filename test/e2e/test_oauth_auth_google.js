var parse = require('url-parse');
var credentials = require('./test-credentials.json').google;

var baseurl = 'http://127.0.0.1:3000';

describe('Signup to micro-ci using Google', function() {
  it('should execute the oauth2.0 flow', function() {

    browser.driver.get(baseurl + '/login');
    browser.driver.findElement(by.css('#login-google')).click();

    // Check redirection to github
    // See http://stackoverflow.com/questions/29952764/protractor-get-url-of-not-angular-page
    browser.ignoreSynchronization = true;
    expect(browser.getCurrentUrl()).toContain('https://accounts.google.com/');
    browser.ignoreSynchronization = false;

    // Authenticate
    //NOTE: the test user should have been authorized at least once
    // If not, test will fail because there will be a second github page,
    // before redirecting to micro-ci
    browser.driver.findElement(by.css('#Email')).sendKeys(credentials.username);
    browser.driver.findElement(by.css('#next')).click();

    browser.driver.findElement(by.css('#Passwd')).sendKeys(credentials.password);
    browser.driver.findElement(by.css('#signIn')).click();

    browser.driver.findElement(by.css('#submit_approve_access')).click();

    //browser.driver.findElement(by.css('#password')).sendKeys(credentials.password);
    // Check we are properly redirected back to micro-ci
    browser.ignoreSynchronization = true;
    url = browser.getCurrentUrl();
    expect(url).toContain(baseurl);
    browser.ignoreSynchronization = false;
  });
});
