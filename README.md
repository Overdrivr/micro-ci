# Micro-ci
> Continuous Integration service for embedded systems

# Run
1. Copy `providers.example.json` and rename to `providers.json`. Fill all the different fields for each third-party authentication provider.

2. Start the server

```
node .
```

# Tests
## unit tests

```
mocha ./test/unit
```

## end to end
### on Unix systems
```
webdriver-manager start &
node . &
protractor conf.js
```
### on Windows
Open first console to start selenium server.
```
webdriver-manager start
```
Open second console to start micro-ci server.
```
node .
```
Finally, open third console and run the integration tests
```
protractor conf.js
```
