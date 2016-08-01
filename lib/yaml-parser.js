var yaml = require('yaml');
var inArray = require('in-array');

function yamlParser (stringYaml) {
  var parsed = [];
  parsed = yaml.eval(stringYaml);
  yamlSanityCheck(parsed);
  return parsed;
}

function yamlSanityCheck(parsedYaml) {
  //console.log(parsedYaml);
  var supportedOptions = ['build', 'after_success', 'after_failure', 'deploy', 'platforms', 'binary_file'];
  var neededOptions = ['build', 'after_success', 'after_failure', 'platforms'];

  //Check all options are valid
  for(var i in parsedYaml)
  {
    if(!inArray(supportedOptions, i ))
      throw new SyntaxError('Unsupported option in yaml file: ' + i);
  }

  //Check needed options
  for(i in neededOptions)
  {
    if(!(neededOptions[i] in parsedYaml))
      throw new SyntaxError('Unspecified mandatory option in yaml file: ' + neededOptions[i]);
  }
}

exports.yamlParser = yamlParser;
