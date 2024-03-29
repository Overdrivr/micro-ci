var GitHubApi    = require('github');

var github = new GitHubApi({
  // optional
  debug: false,
  protocol: "https",
  host: "api.github.com",
  headers: {
      "user-agent": "micro-ci-app"
  },
  Promise: require('bluebird'),
  followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
  timeout: 5000
});

module.exports = github;
