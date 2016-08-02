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
    var ctrl = this;
    Repository.listGithub(function(res) {
      ctrl.repositories = res.repositories;
    });
  });
