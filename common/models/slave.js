var jenkins   = require('../../server/jenkinsInstance').jenkinsInstance,
    config    = require('../../server/config'),
    isIp      = require('is-ip'),
    slave_api = require('../../lib/localhost_slave_api');

var utils = require('../../lib/utils');

var maxNbOfSlaves = config.nbOfSlaves;

module.exports = function(Slave) {

  // This function check if we can powerup a slave and will power up if possible
  // Callback is used to inform that you can reate a slave
  Slave.check_and_boot_slave = function(cb) {

    cb = cb || utils.createPromiseCallback();

    // There are no pendings build
    if(Slave.app.models.Build.get_nbPendingBuild() <= 0){
      cb();
      return ;
    }

    // if we have not reach the limit of slaves, power up one
    Slave.count({}, function(err, cnt) {
      if(err){
        cb(err);
        return ;
      }
      if(cnt >= maxNbOfSlaves){
        cb(new Error('Max number of slave has been reached'));
        return ;
      }

      Slave.create({status:"booting"}, function (err) {

        if(err){
         cb(err);
         return ;
       }

        if(err = Slave.app.models.Build.dec_nbPendingBuild()){
           cb(err);
           return ;
        }
        slave_api.boot_slave("http://"+config.host+":"+config.port,
        function(err) {

          if(err) {
            cb(err);
            return ;
          }
          cb();
          return ;
        });
      });
    });
    return cb.promise;
  }


  Slave.boot = function(ip, cb) {
    if(!isIp(ip)) return cb(new Error("IP " + ip + " is not a valid IP"));
    //At least one slave should be in boot mode
    Slave.findOne({where:{status:"booting"}}, function(err, slave) {
      if(err || !slave) return cb(new Error("No slave in booting mode" + slave));

      slave.updateAttributes({status: "building", IP:ip}, function(err) {
        if(err) return cb(err);

        jenkins.create_node(slave.getId(), ip, function(err) {
          if(err) return cb(err);
          cb(null, slave.getId());
        });
      });
    });
  }

  Slave.remoteMethod(
    'boot',
    {
      accepts: [{arg: 'ip', type: 'string'}],
      returns: {arg: 'id', type:'number'},
      http: {path:'/:ip/boot'}
    }
  );
};
