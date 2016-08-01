'use strict';

/**
 * @ngdoc function
 * @name microCiApp.controller:AccountCtrl
 * @description
 * # AccountCtrl
 * Controller of the microCiApp
 */
angular.module('microCiApp')
  .controller('AccountCtrl', function (Repository) {
    console.log("Fetching repos");
    Repository.listGithub(function(err, repos) {
      if (err) console.log(err);
      console.log(repos);
    });
  });
