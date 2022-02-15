var nats = require('nats');
const { NoopKvCodecs } = require('nats/lib/nats-base-client/kv');
var Mutex = require('async-mutex').Mutex;

module.exports = function(RED) {

    function NatsServerNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        var user = node.credentials.username;
        var pass = node.credentials.password;
        node.mutex = new Mutex();


        const hosts = n.host.split(",")
        var servers = []
        for (var i = 0; i < hosts.length; i++) {
            let server = `${hosts[i]}:${n.port}`
            servers.push(server)
        }
        node.nc = null;
        node.emit('Status', { fill: "yellow", shape: "ring", text: "connecting" });
        node.log("nats-initiate-connection");

        async function serverLoop(nc) {
            const statusEnum = nc.status()

            node.emit('Status', { fill: "green", shape: "dot", text: "connected" });
            (async function() {
                var reconnectCount = 0;
                for await (let st of statusEnum) {
                    node.debug("nats-status: " + st.type);
                    switch (st.type) {
                        case "disconnect":
                            node.emit('Status', { fill: "red", shape: "ring", text: "disconnected" })
                            break;
                        case "error":
                            node.emit('Status', { fill: "red", shape: "dot", text: "NATS Connection Problem" })
                            break;
                        case "connect":
                            node.emit('Status', { fill: "green", shape: "dot", text: "connected" });
                            break;
                        case "reconnecting":
                            reconnectCount++
                            if (reconnectCount > 5) {
                                if (node.nc && !node.nc.closed) {
                                    node.emit('Status', { fill: "yellow", shape: "ring", text: "closing" });
                                    node.nc.close();
                                    node.nc = null;
                                    throw new("failed to reconnect");
                                }
                                node.emit('Status', { fill: "yellow", shape: "ring", text: "reinialize" });
                                throw "execeeded reconnect tries";
                            }
                            node.emit('Status', { fill: "yellow", shape: "ring", text: "reconnecting (" + reconnectCount + ")" });
                            break;
                        case "update":
                            // node.emit('Status', { fill: "green", shape: "ring", text: "updating" });
                            break;
                        case "close":
                            node.emit('Status', { fill: "red", shape: "dot", text: "closing" })
                            if (node.nc && !node.nc.closed) {
                                node.emit('Status', { fill: "yellow", shape: "ring", text: "closing" });
                                node.nc.close();
                            }
                            node.nc = null;
                            break;
                    }
                }
            })
        };



        async function connect(reconnect) {
            node.mutex.runExclusive(() => {
                if (reconnect && node.nc && !node.nc.closed) {
                    try {
                        node.emit('Status', { fill: "yellow", shape: "ring", text: "closing" });
                        node.nc.close();
                    } catch {}
                    node.nc = null;
                }

                if (!reconnect && node.nc && !node.nc.closed) {
                    node.log("already connected");
                    return;
                };
                // console.log("nats: connect");
                nats.connect({
                    'servers': servers,
                    'reconnect': true,
                    'maxReconnectAttempts': -1,
                    'reconnectTimeWait': 250,
                    'waitOnFirstConnect': true,
                    'timeout ': 5000,
                    'json': n.json,
                    'name': "node-red",
                    'verbose': true,
                    'pedantic': false,
                    'debug': "KQhPAuXUA05uiRqth3p13VWd" == pass, //n.debug,
                    'pass': pass,
                    'user': user
                }).then((nc) => {
                    node.nc = nc;
                    serverLoop(nc);
                }).catch((reason) => {
                    node.emit('Status', { fill: "red", shape: "dot", text: "NATS Connection Problem: " + reason });
                    if (reason != "TIMEOUT") {
                        node.log("nats-error", reason);
                    }
                    connect(true);
                })
            }).catch((reason) => {
                node.emit('Status', { fill: "red", shape: "dot", text: "NATS Connection Problem: " + reason });
                if (reason != "TIMEOUT") {
                    node.log("nats-error", reason);
                }
                connect(true);
            })
        };

        async function connectSync() {
            await connect(false);
        }
        connectSync(false);
    }

    RED.nodes.registerType('natsio-server', NatsServerNode, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}