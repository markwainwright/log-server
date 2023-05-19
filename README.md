# `log-server`

A simple Node.js HTTP or TCP server that logs incoming connections and requests in a readable way.

![Screenshot](doc/screenshot.png)

The second column is a counter of TCP connections, making it easier to reason about which data came
in over which connection, for example to troubleshoot HTTP keep alive.

## Install

```sh
npm ci
npm start
```

## Run

```sh
# Start server in HTTP mode on port 8080:
npm start

# Start server in HTTP mode on port 80:
npm start -- http 80

# Start server in TCP mode on port 4444:
npm start -- tcp 4444

# Restart automatically when code changes (for development):
npm run start:watch
```

## Customizing server behaviour

### HTTP mode

- `GET /status/:code` - respond with that HTTP status code immediately
- `GET /sleep/:duration` - respond with `200 OK` after that amount of milliseconds (after receiving
  a full request)
- `GET /*` - respond with `200 OK` immediately

e.g.

```sh
$ curl http://localhost:8080/sleep/2000
```

### TCP mode

- `sleep 2000` - sleep for 2 seconds before running the next command
- `echo foo` - send `foo` back to the client
- `fin` - close the connection
- `rst` - forcibly reset the connection

Each newline-separated command will be queued and executed in order.

e.g.

```sh
$ printf "echo hello\nsleep 2000\necho  world\nsleep 1000\nfin" | nc localhost 4444
```
