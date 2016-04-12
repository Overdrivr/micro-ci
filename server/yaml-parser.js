var yaml = require("yaml");
var inArray = require("in-array");
function yaml_parser (stringYaml)
{
  var parsed = [];
  parsed = yaml.eval(stringYaml);
  yaml_sanitycheck(parsed);
  return parsed;
}

function yaml_sanitycheck(parsedYaml)
{
  //console.log(parsedYaml);
  var supportedOptions = ["build", "after_success", "after_failure", "deploy", "platforms", "binary_file"];
  var neededOptions = ["build", "after_success", "after_failure", "platforms"]

  //Check all options are valid
  for(var i in parsedYaml)
  {
    if(!inArray(supportedOptions, i ))
      throw new SyntaxError("Unsupported option in yaml file: " + i);
  }

  //Check needed options
  for(var i in neededOptions)
  {
    if(!(neededOptions[i] in parsedYaml))
      throw new SyntaxError("Unspecified mandatory option in yaml file: " + neededOptions[i]);
  }
}




exports.yaml_parser = yaml_parser;
