//var jenkins = require('../../lib/jenkins');

module.exports = function slavesManager(app) {

  console.log("Enabling slaves manager");
  app.get('/slave/:ip/boot',
    function(req, res){
      console.log(req.params.ip);
      res.status(200).end();

      //Add the slave to jenkins and enable it 
    });

}
