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
