# `log-server`

A Node.js HTTP or TCP server that:

- logs incoming connections and requests in a readable way
- allows response behaviour to be customized on a per-request basis (see below)

![Screenshot](doc/screenshot.png)

The second column is a counter of TCP connections, making it easier to reason about which data came
in over which connection, for example to troubleshoot HTTP keep alive.

## Install

```sh
npm ci
```

## Run

```sh
# Start server in HTTP mode on port 8080:
npm start

# Start server in HTTP mode on port 80:
npm start -- http 80

# Start server in TCP mode on port 4444:
npm start -- tcp

# Start server in TCP mode on port 5555:
npm start -- tcp 5555

# Restart automatically when code changes (for development):
npm run start:watch
```

## Customizing response behaviour

### HTTP mode

| Request path               | Respond with...                                                 |
| -------------------------- | --------------------------------------------------------------- |
| `/status/:code`            | Status `:code`                                                  |
| `/sleep/headers/:duration` | Status 200 and body after `:duration` milliseconds              |
| `/sleep/body/:duration`    | Status 200 immediately, and body after `:duration` milliseconds |
| `/echo/:message`           | Status 200 with body set to `:message`                          |
| `/echo`                    | Status 200 with body set to request body                        |
| `/*`                       | Status 200                                                      |

Supports compressed responses (`br`, `gzip`, `deflate`) according to `Accept-Encoding` request
header.

e.g.

```sh
$ curl http://localhost:8080/sleep/2000
```

### TCP mode

Each newline-separated command will be queued and executed in order:

| Command      | Behaviour                                           |
| ------------ | --------------------------------------------------- |
| `sleep 2000` | Sleep for 2 seconds before running the next command |
| `echo foo`   | Send `foo` back to the client                       |
| `fin`        | Close the connection                                |
| `rst`        | Forcibly reset the connection                       |

e.g.

```sh
$ printf "echo hello\nsleep 2000\necho  world\nsleep 1000\nfin" | nc localhost 4444
```
