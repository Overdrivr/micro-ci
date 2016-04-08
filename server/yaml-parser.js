var yaml = require("yaml");
var inArray = require("in-array");
function yaml_parser (stringYaml, parsed)
{
  var parsed = [];
  try
  {
    parsed = yaml.eval(stringYaml);
    yaml_sanitycheck(parsed);
  }
  catch(err)
  {
    throw new Error("Invalid syntax in yaml file:" + err);
  }
}

function yaml_sanitycheck(parsedYaml)
{
  var supportedOptions = ["build", "after_success" "after_failure", "deploy", "platforms", "binary_file"];
  var neededOptions = ["build", "after_success" "after_failure", "platforms"]
  //Check all options are valid
  for(var i=0;  < parsedYaml.length ; i++)
  {
    if(!inArray(parsedYaml[i], supportedOptions))
      throw new Error("Unsupported option in yaml file: " + parsedYaml[i]);
  }
}


exports.yaml_parser = yaml_parser;
