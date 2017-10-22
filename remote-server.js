var nats = require('nats');

module.exports = function(RED) {
    function RemoteServerNode(config) {
        RED.nodes.createNode(this,config);
        this.host = config.host;
        this.port = config.port;
        var user = config.user;
        var pass = config.pass;

        let server = 'nats://'
        if(user){
          server += user + (pass? ':'+ pass : '') + "@"
        }
        server += config.host + ':' + config.port
        this.nc = nats.connect({'servers': [server]});

        var node = this;
        node.on('close', function() {
          if (node.nc) {
            node.nc.close();
          }
        });
    }
    RED.nodes.registerType("remote-server",RemoteServerNode);
}
