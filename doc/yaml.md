YAML Syntax
===========

You can customizing each step of your build with the yaml file.

Build Life cycle:
------------------

Here below are described the life cycle of a job:
1. `build`
2. `after_success` or `after_failure`
3. OPTIONAL `deploy`

All this step are executed one after the other.
In each step you can run any bash script as followed :
build:
  - make compile

You can also run multiple steps:
build:
 - make compile
 - make test


Parameters:
------------
You need to provide parameters to micro-ci.

 * `platforms`
  Define all the platforms on which you want to build your project.
  One worker will be deployed by platform.

To see all supported platforms please refer to : TODO



Statistics:
------------
To provide you some statistics micro ci need the location of some project file :

 * binary_file
  Provide the compiled binary file.
