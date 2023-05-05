# `log-server`

A simple Node.js HTTP server that logs incoming connections and requests in a readable way.

![Screenshot](doc/screenshot.png)

The second column is a counter of TCP connections, making it easier to reason about which requests
came in over which connection, for example to debug HTTP keep alive.

## Install

```sh
npm ci
npm start
```

## Run

```sh
# Listen on port 8080:
npm start

# Listen on a custom port:
PORT=4444 npm start

# Restart automatically when code changes (for development):
npm run start:watch
```

## Routes

`ANY /status/:code` - respond with that HTTP status code immediately

`ANY /sleep/:duration` - respond with `200 OK` after that amount of milliseconds (after receiving a
full request)

`ANY /*` - respond with `200 OK` immediately
