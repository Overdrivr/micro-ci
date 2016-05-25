var app = require('../../server/server');
var async = require('async');

module.exports = function(Repository) {

  Repository.disableRemoteMethod('create', true);
  Repository.disableRemoteMethod('upsert', true);
  Repository.disableRemoteMethod('updateAttributes', false);
  Repository.disableRemoteMethod('deleteById', true);

  Repository.disableRemoteMethod('createChangeStream', true);
  Repository.disableRemoteMethod('count', true);
  Repository.disableRemoteMethod('findOne', true);
  Repository.disableRemoteMethod('updateAll', true);

  Repository.webhookGithub = function webhookGithubCallback(repository, after, cb) {
    async.waterfall([
      // Identify repository
      function(callback) {
        Repository.find({
          'where': {
            'platform': 'github',
            'remoteId': repository.id
          }
        }, function(err, repositories) {
            if(err) return callback(err)
            if(!repositories) return callback(new Error('Github repository with id ',repository.id,' not found.'));
            if(repositories.length > 1) return callback(new Error('Found multiple Github repositories with id ', repository.id));

            callback(null, repositories[0]);
          });
      },

      // Create a new commit if it doesn't exists already
      function(repositoryInstance, callback) {
        app.models.Commit.find({
          'where': {
            'commithash': after
          }
        },
        function(err, commits) {
          if(err) return callback(err);
          if(commits.length > 1) return callback(new Error('Found multiple Commits under hash ',after));
          if(commits.length == 1) return callback(null, commits[0])

          app.models.Commit.create({
            "commithash": after
          }, function(err, models){
            if(err) return callback(err);
            callback(null, repositoryInstance, models[0]);
          });
        });
      },

      // Webhook processing done successfully
      function(repositoryInstance, commitInstance, callback) {
        //TODO: Trigger a job creation ?
        cb();
      }
    ],
    // Webhook processing failed somewhere
    function(err, results) {
      cb(err);
    });
  };

  Repository.remoteMethod(
      'webhookGithub',
      {
          http: {path: '/webhook/github', verb: 'post'},
          accepts: [
            { arg: 'repository', type: 'Object' },
            { arg: 'after', type: 'string'}
          ]
      }
  );

};
