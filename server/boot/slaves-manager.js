//var jenkins = require('../../lib/jenkins');




module.exports = function slavesManager(app) {

  console.log(app.get('nbOfSlaves'));
  console.log("Enabling slaves manager");
  app.get('/slaveManager/slave/:ip/boot',
    function(req, res){//Slave complete is booting operation 
      console.log(req.params.ip);
      res.status(200).end();


    });


  //Ask for a new build
  app.get('/slaveManager/build/:id/',
    function(req, res){

      if(slaves.length < maxNbOfSlaves)
      {
        //Boot slave TODO
        var slave = {status : "BOOTING", ip :"", jobId :req.params.id }
        slaves.push(slave);
      }
      else { //Add to the queue list
        var job = {id:req.params.id};
        queuedJobs.push(job);
      }

      res.status(200).end();

      //Add the slave to jenkins and enable it
    });


    app.get('/slaveManager/slave/:ip/end',
      function(req, res){
        console.log(req.params.ip);
        //Find the slave and remove it TODO

        if(queuedJobs.length > 0)
        {

        }

        res.status(200).end();

        //Add the slave to jenkins and enable it TODO
      });


}
