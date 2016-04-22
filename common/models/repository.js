module.exports = function(Repository) {

  Repository.webhookGithub = function(repository, cb) {
    // Identify repository
    Repository.find({
      "where": {
        "platform": "github",
        "remoteId": repository.id
      }
    }, function(object, err){
      //TODO: Validate commit id with github
      //TODO:
      cb();
    });
  }

  Repository.remoteMethod(
      'webhookGithub',
      {
          http: {path: '/webhook/github', verb: 'post'},
          accepts: {arg: 'repository', type: 'Object'}
      }
  );

};
