var nats = require('nats');
const { NoopKvCodecs } = require('nats/lib/nats-base-client/kv');

module.exports = function (RED) {
  function NatsServerNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var user = node.credentials.username;
    var pass = node.credentials.password;

    const hosts = n.host.split(",")
    var servers = []
    for (var i = 0; i < hosts.length; i++) {
      let server = `${hosts[i]}:${n.port}`
      servers.push(server)
    }
    node.nc = null;
    nats.connect({
      'servers': servers,
      'maxReconnectAttempts': -1,
      'reconnectTimeWait': 250,
      'json': n.json,
      'name': "node-red",
      'debug': true,
      'pass': pass,
      'user': user,
    }).then((nc) => {
      node.nc = nc;
      node.emit('Status', { fill: "green", shape: "dot", text: "connected" });
      let statusEnum = nc.status();
      (async function () {
        for await (let st of statusEnum) {
          node.log("nats-status: " + st.type)
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
              node.emit('Status', { fill: "green", shape: "ring", text: "connecting" });
              break;
            case "disconnect":
              node.emit('Status', { fill: "red", shape: "ring", text: "disconnected" })
              break;
            case "close":
              node.emit('Status', { fill: "red", shape: "dot", text: "closing" })
              if (node.nc || !node.nc.closed) {
                node.nc.close();
              }
              node.nc = null;
              break;
          }
        }
      })();
    }).catch((reason) => {
      console.log("NatsError", reason)
      node.emit('Status', { fill: "red", shape: "dot", text: "NATS Connection Problem" })
    })
  }

  RED.nodes.registerType('natsio-server', NatsServerNode, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" }
    }
  });
}
