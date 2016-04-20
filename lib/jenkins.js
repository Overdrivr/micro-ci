var jenkins = require('jenkins')('http://localhost:8080');

var xml = require('xml');

function Jenkins()
{

}

Jenkins.prototype.get_build_log = function(build_id, callback)
{
  var name =  'build_' + build_id;

  //Check the job does not exist
  jenkins.job.exists(name, function(err, exists) {
    if (err) callback(err, null)

    else if(!exists)
      callback(Error("Job "+ name + " does not exist"), 0);
    else
      jenkins.build.log(name, 1, function(err, data) {
        if (err) callback(err, null);

        callback(null, data)
      });

  });
}


Jenkins.prototype.get_build_status =function (build_id, callback)
{
  var name =  'build_' + build_id;

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
//build_id: id of the build
//yaml: parsed yaml file
//endpoint: url of the callback when job completed
Jenkins.prototype.build = function (build_id, yaml, endpoint, callback)
{


  var name = 'build_' +build_id;

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
    if (err) callback(err, null);

    if(exists)
      callback(Error("Job "+ name + " already exist"))
    //Create the job
    jenkins.job.create(name, xml(config), function(err) {
      callback(err, null);
      //Build the job:

      jenkins.job.build(name, function(err) {
        callback(err, null);

      });


    });
  });
}


exports.jenkins = Jenkins;
