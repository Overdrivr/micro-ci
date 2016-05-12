var jenkins = require('../../lib/jenkins'); //TODO this should be available for anyone
var slave_api = require('../../lib/localhost_slave_api');

//TODO put site name (127.0.0.1/ micro-ci.com) in a variable
//TODO manage the err and not throw them
//TODO replace on method by operation hooks
module.exports = function slavesManager(app) {

  console.log(app.get('nbOfSlaves'));
  console.log("Enabling slaves manager");



}
