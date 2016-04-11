var yaml = require("yaml");
var inArray = require("in-array");
function yaml_parser (stringYaml, parsed)
{
  var parsed = [];
  parsed = yaml.eval(stringYaml);
  yaml_sanitycheck(parsed);
}

function yaml_sanitycheck(parsedYaml)
{
  var supportedOptions = ["build", "after_success" "after_failure", "deploy", "platforms", "binary_file"];
  var neededOptions = ["build", "after_success" "after_failure", "platforms"]

  //Check all options are valid
  for(var i=0;  < parsedYaml.length ; i++)
  {
    if(!inArray(parsedYaml[i], supportedOptions))
      throw new SyntaxError("Unsupported option in yaml file: " + parsedYaml[i]);
  }

  //Check needed options
  //Check all options are valid
  for(var i=0;  < neededOptions.length ; i++)
  {
    if(!inArray(neededOptions[i], parsedYaml))
      throw new SyntaxError("Unspecified mandatory option in yaml file: " + neededOptions[i]);
  }
}


exports.yaml_parser = yaml_parser;
