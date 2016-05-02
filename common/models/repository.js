module.exports = function(Repository) {

  Repository.webhook = function(msg, cb) {
    // Call webhook logic from here
    cb();
  }

  Repository.remoteMethod(
      'webhook',
      {
          accepts: {payload: 'payload', type: 'Object'},
          returns: {}
      }
  );

};
