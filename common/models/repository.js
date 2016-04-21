module.exports = function(Repository) {

  Repository.webhook = function(payload, cb) {
    // Call webhook logic from here
    cb();
  }

  Repository.remoteMethod(
      'webhook',
      {
          accepts: {arg: 'payload', type: 'Object'}
      }
  );

};
