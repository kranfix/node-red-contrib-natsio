var nats = require('nats');

module.exports = function(RED) {
  function RemoteServerNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    let server = 'nats://'
    if(n.user){
      server += n.user + (n.pass? ':'+ n.pass : '') + '@'
    }
    server += n.host + ':' + n.port

    node.nc = nats.connect({
      'servers': [server],
      'maxReconnectAttempts': -1,
      'reconnectTimeWait': 250
    });

    node.nc.on('error', (e) => {
      node.log(e)
      node.emit('Status', {fill:"red",shape:"dot",text:"Broker not found"})
    })
    node.nc.on('connect', () => {
      node.emit('Status',{fill:"green",shape:"dot",text:"connected"});
    })
    node.nc.on('reconnecting', () => {
      node.emit('Status', {fill:"green",shape:"ring",text:"connecting"});
    })
    node.nc.on('reconnected', () => {
      node.emit('Status', {fill:"green",shape:"dot",text:"reconnected"});
    })
    node.nc.on('disconnect', () => {
      node.emit('Status', {fill:"red",shape:"ring",text:"disconnected"})
    })

    node.on('close', function() {
      if (node.nc || node.nc.closed) {
        node.nc.close();
      }
    });
  }
  RED.nodes.registerType('natsio-server',RemoteServerNode);
}
