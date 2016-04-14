 var jenkins = require('jenkins')('http://localhost:8080');

var xml = require('xml');



function get_build_status(project_name, hash, callback)
{
  var name = project_name + '_' + hash;

  //Check the job does not exist
  jenkins.job.exists(name, function(err, exists) {
    if (err) callback(err, 0)

    else if(!exists)
      callback(Error("Job "+ name + " does not exist"), 0);

    jenkins.build.get(name, 1, function(err, data) {
      if (err) callback(Error("Job "+ name + " does not exist"), 0);

      callback(null, data["result"] == "SUCCESS")

    });

  });
}

// create_job Create a jenkins job and send it to jenkins for run
//name name of the repository/project
//hash: commit hash
//yaml: parsed yaml file
//endpoint: url of the callback when job completed
function create_job(project_name, hash, yaml, endpoint)
{


  var name = project_name + '_' + hash;

  var builds = [];
  var commands = "";
  for(var i in yaml['build'])
  {
    commands += yaml['build'][i] + "\n"

  }

  console.log(commands);
  var config = {project :
  [{action:""},
  {description:""},
  {keepDependencies:false},
  {properties: [
    {"com.tikal.hudson.plugins.notification.HudsonNotificationProperty": [{_attr:{plugin:"notification@1.10"}},
      {endpoints: [{
        "com.tikal.hudson.plugins.notification.Endpoint" : [
          {protocol: "HTTP"},
          {format:"JSON"},
          {url:endpoint},
          {event:"all"},
          {timeout:30000},
          {loglines:0}
      ]}]
      }

    ]}

  ]},
  {scm : [{_attr:{class:"hudson.scm.NullSCM"}}]},
  {canRoam:true},
  {disabled:false},
  {blockBuildWhenDownstreamBuilding:false},
  {blockBuildWhenUpstreamBuilding:false},
  {triggers:""},
  {concurrentBuild : false},
  {builders:[
    {"hudson.tasks.Shell" : [{command:commands}]}
    ]},
  {publishers:""},
  {buildWrappers:""}
 ]};


  console.log(xml(config,{ indent:true}));

  //Check the job does not exist
  jenkins.job.exists(name, function(err, exists) {
    if (err) throw err;

    if(exists)
      throw Error("Job "+ name + " already exist")
    //Create the job
    jenkins.job.create(name, xml(config), function(err) {
      if (err) throw err;
      //Build the job:

      jenkins.job.build(name, function(err) {
        if (err) throw err;

      });


    });
  });
}

var yaml = {build : ["echo 'Hello' ", "sleep 2", "exit 1"]};
create_job("test", "42", yaml, "http://localhost/");


/*get_build_status("test", "33", function(err, status)
  {
    if(err) throw err;
    console.log("status: " + status);
  });
*/
