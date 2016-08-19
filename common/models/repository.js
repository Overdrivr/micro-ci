var app          = require('../../server/server'),
    async        = require('async'),
    github       = require('../../server/helpers/github-setup.js'),
    loopback     = require('loopback'),
    webhookConfig= require('../../server/webhook-config.json').config,
    webhookEvents= require('../../server/webhook-config.json').events;

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

  Repository.activate = function(platform, remoteId, cb) {
    async.waterfall([

      function(callback) {
        // Check input sanity
        if(!platform) return callback(Error('platform is undefined'));
        if(!remoteId) return callback(Error('remoteId is undefined'));

        // Try to get the accessToken to identify the user
        var ctx = loopback.getCurrentContext();
        var currentToken = ctx.get('accessToken');
        var currentUserId = currentToken.userId;
        if(!currentToken) return callback(Error('You need to be authenticated'));

        github.authenticate({
            type: "oauth",
            token: currentToken.id
        });

        // Check the repository exists
        github.repos.getById({
          id: remoteId
        }, function(err, repository) {
          if (err) return callback(err);
          if(!repository) return callback(Error('Requested repository does not exist'));
          callback(null, currentToken, repository);
        });

      },

      // Check the user requesting the activation is the owner
      function(currentToken, githubRepoData, callback) {

        var currentUserId = currentToken.userId;

        app.models.Client.findById(currentUserId, function(err, user){
          if(err) return callback(err);
          if(githubRepoData.owner.id !== user.providerId) {
            var error = Error('You are not the owner of this repository');
            error.status = 401;
            return callback(error);
          }
          callback(null, currentToken, user);
        });
      },

      // Try to find an already existing repo in the database
      function(currentToken, user, callback) {
        Repository.find({
          where: {
            "platform": platform,
            "remoteId": remoteId
          }
        }, function(err, repositories) {
          if (err) return callback(err);
          if(repositories.length > 1) return callback(Error('Found multiple Github repositories matching.'));
          // TODO : Check whether repo is active or not
          callback(null, currentToken, user, repositories);
        });
      },

      // Create a new repository if it doesnt exist
      function(currentToken, user, repositories, callback) {
        if(repositories.length == 1) return callback(null, repositories[0]);
        user.__create__repositories({
          "platform": platform,
          "remoteId": remoteId
        }, function(err, createdRepository) {
          if (err) return callback(err);
          callback(null, currentToken, user, createdRepository);
        });
      },

      // Tell github to generate the webhook
      // TODO: Activate webhook if not already done ? Or update it anyway ?
      function(currentToken, user, createdRepository, callback) {

        github.authenticate({
            type: "oauth",
            token: currentToken.id
        });

        github.repos.createHook({
          // TODO : Use actual user data
          user: 'foo',
          repo: 'bar',
          name: 'micro-ci-webhook',
          config: webhookConfig,
          events: webhookEvents
        }, function(err, hook) {
          console.log(hook);
          console.log(err);
          if (err) return callback(err);
          if(!hook) return callback(Error('Error creating hook'));
          callback(null, repository);
        });
      }
    ], function(err, repository){
      if(err) return cb(err);
      cb();
    });
  };

  Repository.remoteMethod(
    'activate',
    {
      http: {
        path: '/activate',
        verb: 'post',
        status: 204
      },
      accepts: [
        { arg: 'platform', type: 'string', required: true},
        { arg: 'remoteId', type: 'number', required: true}
      ]
    }
  );
};
