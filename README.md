node-red-contrib-nats
=====================

[![NPM](https://nodei.co/npm/node-red-contrib-natsio.png?compact=true)](https://nodei.co/npm/node-red-contrib-natsio/)

[NATS](http://www.nats.io/) is a pub/sub protocol for IoT with a request/reply functionality.

Install
-------

This is a fork of a initial work of `node-red-contrib-nats`,
but with independent development.

Run the following command in the root directory of your Node-RED install:

```
npm i node-red-contrib-natsio
```

Functionality supported and ToDo
-------------------------------

For gnatsd:

- [x] Publish
- [ ] |-use callback or promise?
- [x] Subscription
- [x] |-Unsubscription after N messages
- [x] |-Queue
- [x] Request/reply
- [x] |-Timeout
- [x] |-max. replies
- [ ] |-chosen reply subject?
- [x] Configuration node
- [x] |-Node status
- [x] |-Tabs
- [x] |-Credentials: user and password
- [ ] |-Credentials: token
- [x] |-Don't crash on broker connection error (including node-red starting)
- [ ] |-security: TLS
- [ ] |-Configurable reconnecting options
- [ ] Improve documentation

For nats-streaming-server:

- This is a future work
