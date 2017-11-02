node-red-contrib-nats
=====================

[![NPM](https://nodei.co/npm/node-red-contrib-natsio.png?compact=true)](https://nodei.co/npm/node-red-contrib-natsio/)

[NATS](http://www.nats.io/) is a pub/sub protocol for IoT with a request/reply functionality.

Install
-------

This is a fork of a initial work of `node-red-contrib-nats`, then you must uninstall it:

```
npm uninstall node-red-contrib-nats
```


Run the following command in the root directory of your Node-RED install

```
npm i node-red-contrib-natsio
```

Functionality supported and ToDo
-------------------------------

- [x] Publish
- [x] Subscription
- [x]   Unsubscription after N messages
- [ ]   Queue
- [x] Request/reply
- [ ]   Timeout
- [x]   max. replies
- [ ]   chosen
- [x] Configuration node
- [x]   Node status
- [ ]   Credentials
- [ ]   Don't crash when there's no broker connection at node-red starting
- [ ] Improve documentation
