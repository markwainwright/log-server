# `log-server`

A Node.js HTTP, HTTPS, or TCP server that:

- logs incoming connections and requests in a readable way
- allows response behaviour to be customized on a per-request basis (see below)

![Screenshot](doc/screenshot.png)

The second column is a counter of TCP connections, making it easier to reason about which data came
in over which connection, for example to troubleshoot HTTP keep alive.

## Install

```sh
npm ci
```

### Enable HTTPS support

1. [Install mkcert](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#installation)

2. ```sh
   mkcert -install
   cd certs
   mkcert localhost 127.0.0.1
   ```

## Run

```sh
npm start -- [http|https|tcp] [port]
```

- Mode defaults to `http`
- Port defaults to 8080 in `http` mode, 8443 in `https` mode, or 4444 in `tcp` mode

## Customizing response behaviour

### `http` and `https` modes

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

### `tcp` mode

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
