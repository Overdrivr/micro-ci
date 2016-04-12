
var inArray = require("in-array");

var yaml = require("../server/yaml-parser")

var assert = require('assert');

describe('emptyYaml', function(){
  it('Empty yaml file', function(){
    assert.throws( function() { yaml.yaml_parser(""); }, Error );
  });
});


describe('simpleYaml', function(){
  it('Parse a simple yaml file', function(){

    var expected = { build: [ 'make' ],
  after_success: 'exit 0',
  after_failure: 'exit 1',
  deploy: [ 'Do Stuff1', 'Do Stuff2' ],
  platforms: 'KL25Z' };

    var yamlContent =
"\
build:\n\
  -make\n\
after_success: exit 0\n\
after_failure: exit 1\n\
deploy:\n\
  -Do Stuff1\n\
  -Do Stuff2\n\
platforms: KL25Z\
"
    assert.deepEqual( yaml.yaml_parser(yamlContent), expected);
  });
});


describe('missingOption', function(){
  it('Yaml file with missing after_success option', function(){
    var yamlContent =
"\
build:\n\
  -make\n\
after_failure: exit 1\n\
deploy:\n\
  -Do Stuff1\n\
  -Do Stuff2\n\
platforms: KL25Z\
"
    assert.throws( function() { yaml.yaml_parser(yamlContent); }, /Unspecified/ );
  });
});


describe('unknowOption', function(){
  it('Yaml file with un unknow option', function(){
    var yamlContent =
"\
build:\n\
  -make\n\
after_success: exit 0\n\
after_failure: exit 1\n\
deploy:\n\
  -Do Stuff1\n\
  -Do Stuff2\n\
unknowOption: toto\n\
platforms: KL25Z\
"
    assert.throws( function() { yaml.yaml_parser(yamlContent); }, /Unsupported/ );
  });
});
