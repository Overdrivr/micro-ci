[ ![Codeship Status for Overdrivr/micro-ci](https://codeship.com/projects/48e15dc0-0f71-0134-8b30-3a660a5bed18/status?branch=master)](https://codeship.com/projects/156640)
# Micro-ci
> Continuous Integration service for embedded systems


# Run
1. Copy `providers.example.json` and rename to `providers.json`.
Fill all the different fields for each third-party authentication provider.
2. Start the server

```
node .
```

# Tests
## Lint

```
npm run pretest
```

## Unit

```
npm run unit
```

## End to end
Copy `test-credentials.example.json` and rename to `test-credentials.json`.
Fill all the different fields for each third-party authentication provider with
valid accounts from those platforms.

Then, open a first console to start selenium server.
```
webdriver-manager start
```
Open second console to start micro-ci server.
```
node .
```
Finally, open third console and run the integration tests
```
npm run e2e
```
