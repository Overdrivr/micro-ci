var jenkins = require('../../lib/jenkins');
var slave_api = require('../../lib/localhost_slave_api');



module.exports = function slavesManager(app) {

  console.log(app.get('nbOfSlaves'));
  console.log("Enabling slaves manager");
  app.get('/slaveManager/slave/:ip/boot',
    function(req, res){//Slave complete is booting operation
      console.log(req.params.ip);
      res.status(200).end();
      Slave.findOne({where:{status:"booting"}}, function(err, slave)
        if(err)
          return throw err;

        slave.updateAttributes({status: "Building"}, function(err)
        {
          if(err)
            return throw err;
        });
        jenkins.create_node("slave_"+slave.getId(), req.params.ip, function(err)
        {
          if(err)
            return throw err;
        });


      );


    });

    //A build is created
    Builds.on('changed', function (build)
    {
      if(build.status == "created")
      {
        build.updateAttributes({status: "waiting"}, function(err)
        {
          if(err)
          return throw err;

          //Get yaml content
          build.job(function(err, job))
          {
            //push the build to jenkins
            jenkins.build(build.getId(), job.yaml, endpoint, function(err) //TODO where is the endpoint?
            {
              if(err)
                return throw err;

              // if we have not reach the limit of slaves, power up one
              Slaves.count( {}, function(err, cnt){
                if(cnt < maxNbOfSlaves)
                {
                  Slaves.create({status:"booting"}, function (err)
                  {
                    if(err)
                      return throw err;
                    slave_api.boot_slave("http://127.0.0.1:3000");
                  });
                }
              });
            });
          });



        });

      }
    });


    //A build is complete
    app.get('/build/:id/complete',
      function(req, res){
        console.log(req.params.id);
        //Update build status to complete:
        Build.findOne({where:{id:req.params.id}}, function(err, build)
        {
          if(err)
            return throw err;
          //Get build status
          jenkins.get_build_status(build.getId(), function(err, status)
          {
            if(err)
              return throw err;

              build.updateAttributes({status: status}, function(err)
              {
                if(err)
                  return throw err;
              });
          };)
        }

        if(queuedJobs.length > 0)
        {

        }
        res.status(200).end();
        //Add the slave to jenkins and enable it TODO
      });
}
