var app          = require('../../server/server'),
    async        = require('async'),
    github       = require('../../server/helpers/github-setup.js'),
    loopback     = require('loopback');

module.exports = function(Repository) {

  Repository.disableRemoteMethod('find', true);
  Repository.disableRemoteMethod('create', true);
  Repository.disableRemoteMethod('upsert', true);
  Repository.disableRemoteMethod('updateAttributes', false);
  Repository.disableRemoteMethod('deleteById', true);

  Repository.disableRemoteMethod('createChangeStream', true);
  Repository.disableRemoteMethod('count', true);
  Repository.disableRemoteMethod('findOne', true);
  Repository.disableRemoteMethod('updateAll', true);

  Repository.disableRemoteMethod('__create__commits', false);
  Repository.disableRemoteMethod('__delete__commits', false);
  Repository.disableRemoteMethod('__destroyById__commits', false);
  Repository.disableRemoteMethod('__updateById__commits', false);



  Repository.webhookGithub = function webhookGithubCallback(repository, after, cb) {
    async.waterfall([
      function(callback) {
        // Check input sanity
        if(typeof repository.id === 'undefined' || repository.id === null){
          var err = new Error('repository.id is undefined');
          err.status = 400;
          return callback(err);
        }
        callback();
      },
      // Identify repository
      function(callback) {
        Repository.find({
          'where': {
            'platform': 'github',
            'remoteId': repository.id
          }
        }, function(err, repositories) {
            if(err) return callback(err)
            if(repositories.length == 0) return callback(Error('Github repository with id '+ repository.id + ' not found.'));
            if(repositories.length > 1) return callback(Error('Found multiple Github repositories with id ' + repository.id));
            callback(null, repositories[0]);
          });
      },
      function(repositoryInstance, callback) {
        // Detect ping payload (/after/ field containing commit hash will be undefined)
        if(typeof after === 'undefined' || after === null){
          // Call master callback to return early and avoid starting a build
          return cb();
        }

        // Create a new commit if it doesn't exists already
        app.models.Commit.find({
          'where': {
            'commithash': after
          }
        },
        function(err, commits) {
          if(err) return callback(err);
          if(commits.length > 1) return callback(Error('Found multiple Commits under hash ' + after));
          // If commit is found return it (this happens if a commit is being build multiple times)
          if(commits.length == 1) return callback(null, repositoryInstance, commits[0]);
          // Otherwise create one
          repositoryInstance.__create__commits({ commithash: after },
          function(err, createdCommit) {
            if (err) return callback(err);
            if (!createdCommit) return callback(Error('Commit could not be created'));
            callback(null, repositoryInstance, createdCommit);
          });
        });
      },

      // Create a job for this commit
      function(repositoryInstance, commitInstance, callback) {
        commitInstance.__create__jobs({
          yaml: {}
        }, function (err, createdJobs) {
          if (err) return callback(err);
          callback();
        });
      }
    ],
    // Webhook processing failed somewhere
    function(err, results) {
      if (err) return cb(err);
      cb();
    });
  };

  Repository.remoteMethod(
      'webhookGithub',
      {
          http: {
            path: '/webhook/github',
            verb: 'post',
            status: 204,
            errorStatus: 404
          },
          accepts: [
            { arg: 'repository', type: 'Object', required: true },
            { arg: 'after', type: 'string'}
          ]
      }
  );

  Repository.listGithub = function(cb) {
    var ctx = loopback.getCurrentContext();
    var currentToken = ctx.get('accessToken');

    if(!currentToken) return cb(Error('You need to be authenticated'));

    github.authenticate({
        type: "oauth",
        token: currentToken.id
    });

    github.repos.getAll({}, function(err, repos) {
      if (err) return cb(err);

      var names = [];
      for(var i = 0 ; i < repos.length ; i++) {
        names.push(repos[i].full_name);
      }
      cb(null, names);
    });
  };

  Repository.remoteMethod(
      'listGithub',
      {
          http: {
            path: '/me/github',
            verb: 'get',
            status: 200,
            errorStatus: 404
          },
          returns: {
            arg: 'repositories',
            type: 'Array'
          }
      }
  );

};
