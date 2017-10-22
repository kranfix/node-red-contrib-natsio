var nats = require('nats');

module.exports = function(RED) {
    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);

        let server = 'nats://'
        if(n.user){
          server += n.user + (n.pass? ':'+ n.pass : '') + "@"
        }

        var node = this;

        if(n.host && n.port){
          server += n.host + ':' + n.port
          node.log('NATS sever: '+server)
          try {
            node.nc = nats.connect({'servers': [server]});
          } catch (e){

          }
        }

        node.on('close', function() {
          if (node.nc) {
            node.nc.close();
          }
        });
    }
    RED.nodes.registerType('remote-server',RemoteServerNode);
}
