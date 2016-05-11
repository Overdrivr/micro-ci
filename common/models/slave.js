module.exports = function(Slave) {

  //This function check if we can powerup a slave and will power up if possible
  Slave.check_and_boot_slave = function(cb)//Callback is used to inform that you can reate a slave
  {
    // if we have not reach the limit of slaves, power up one
    Slave.count( {}, function(err, cnt){
      if(cnt < maxNbOfSlaves)
      {
        Slave.create({status:"booting"}, function (err)
        {
          if(err)
            return cb(err);
          cb();
        });
      }
      else
        return cb(new Error('Max number of slave has been reached'));
    });
  }
};
