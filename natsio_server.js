var NATS = require('nats');

module.exports = function(RED) {
  function RemoteServerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;
    var user = node.credentials.username;
    var pass = node.credentials.password;

    let server = 'nats://'
    if(user){
      server += user + (pass? ':'+ pass : '') + '@'
    }
    server += `${n.host}:${n.port}`
    let address = {
      'servers': [server],
      'maxReconnectAttempts': -1,
      'reconnectTimeWait': 250,
      'json': n.json
    };
    node.on('start', () => {
      node.nc = NATS.connect(address);
      node.nc.on('connect', () => {
        node.emit('Status', {fill:"green",shape:"dot",text:"connected"});
      });
      node.nc.on('reconnecting', () => {
        node.emit('Status', {fill:"green",shape:"ring",text:"reconnecting"});
      });
      node.nc.on('reconnect', () => {
        node.emit('Status', {fill:"green",shape:"dot",text:"reconnect"});
      });
      node.nc.on('disconnect', () => {
        node.emit('Status', {fill:"red",shape:"ring",text:"disconnected"});
      });
      node.nc.on('error', (e) => {
        node.log(e);
        node.emit('Status', {fill:"red",shape:"dot",text:"Broker not found"});
      });
    });
  
    node.on('close', function() {
      if (node.nc || !node.nc.closed) {
        node.nc.close();
      }
    });
    node.on('try', () => {
      let nats = NATS.connect(address);
      nats.on('error', (e) => {
        nats.close();
        node.log(e);
        node.emit('Status', {fill:"red",shape:"dot",text:"Broker not found"});
      });
      nats.on('connect', () => {
        nats.close();
        node.emit('start', {});
      });
    });
    node.emit('try', {});
  }

  RED.nodes.registerType('natsio-server',RemoteServerNode,{
    credentials: {
      username: {type:"text"},
      password: {type: "password"}
    }
  });
}
