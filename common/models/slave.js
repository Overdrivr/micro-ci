
var jenkins = require('../../server/jenkinsInstance').jenkinsInstance;

var config = require('../../server/config');
var maxNbOfSlaves = config.nbOfSlaves;

var isIp = require('is-ip');

var slave_api = require('../../lib/localhost_slave_api');

module.exports = function(Slave) {

  //This function check if we can powerup a slave and will power up if possible
  Slave.check_and_boot_slave = function(cb)//Callback is used to inform that you can reate a slave
  {
    if(Slave.app.models.Build.get_nbPendingBuild() > 0) // There are pendings build
    {
      // if we have not reach the limit of slaves, power up one
      Slave.count( {}, function(err, cnt){
        if(err)
          return cb(err);
        if(cnt < maxNbOfSlaves)
        {
          Slave.create({status:"booting"}, function (err)
          {
            if(err)
              return cb(err);

            slave_api.boot_slave("http://"+config.host+":"+config.port, function(err)
            {
              if(err)
                return cb(err);
              if(err = Slave.app.models.Build.dec_nbPendingBuild())
                return cb(err)
              return cb();

            });
          });
        }
        else
          return cb(new Error('Max number of slave has been reached'));
      });
    }
    else
      return cb();
  }


  Slave.boot = function(ip, cb) {
    if(isIp(ip))
    {
      Slave.findOne({where:{status:"booting"}}, function(err, slave) //At least one slave should be in boot mode
      {
        if(err || !slave)
          return cb(new Error("No slave in booting mode" + slave));
        slave.updateAttributes({status: "building", IP:ip}, function(err)
        {
          if(err)
            return cb(err)

          jenkins.create_node(slave.getId(), ip, function(err)
          {                     
            if(err)
              return cb(err)

            return cb(null, slave.getId());
          });
        });

      });
    }
    else {
      return cb(new Error("IP " + ip + " is not a valid IP"))
    }
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
