var nats = require('nats');
module.exports = function(RED) {

  function NatsSubNode(config) {
    RED.nodes.createNode(this, config);

    this.address = config.address;
    this.port = config.port;
    this.user = config.user;
    this.pass = config.pass;
    this.subject = config.subject;

    var server = 'nats://' + config.user + ':' + config.pass + '@' + this.address + ':' + this.port + '/';

    this.nc = nats.connect({'servers': [server]});
    //console.log('nats server connect:' + server);

    var node = this;

    var sid = node.nc.subscribe(this.subject,  function(message, replyTo, subject) {
      //console.log('subject: ' + subject + 'message: ' + message);
      var msg = {
        payload: message,
        topic: subject
      };

      if(replyTo){
        msg.replyTo = replyTo
      }
      node.send(msg);
    });

    node.on('close', function() {
      if (node.nc) {
        node.nc.unsubscribe(this.subject,sid);
        node.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-sub",NatsSubNode);

  function NatsPubNode(config) {
    RED.nodes.createNode(this, config);

    this.address = config.address;
    this.port = config.port;
    this.user = config.user;
    this.pass = config.pass;

    var server = 'nats://' + config.user + ':' + config.pass + '@' + this.address + ':' + this.port + '/';
    this.nc = nats.connect({'servers': [server]});
    //console.log('nats server connect:' + server);
    var node = this;

    this.on('input', function(msg) {
      //this.subject = msg.replyTo || msg.topic || config.subject;
      console.log('pub: ',msg.replyTo)
      this.subject = msg.replyTo || msg.topic || config.subject;
      this.message = msg.payload || config.message;
      //console.log('subject: ' + this.subject + ' message: ' + this.message);

      if(this.subject && this.message){
        this.nc.publish(this.subject, this.message);
      }
    });

    this.on('close', function() {
      if (this.nc) {
        this.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-pub",NatsPubNode);

  function NatsRequestNode(config) {
    RED.nodes.createNode(this, config);

    this.address = config.address;
    this.port = config.port;
    this.user = config.user;
    this.pass = config.pass;

    var server = 'nats://' + config.user + ':' + config.pass + '@' + this.address + ':' + this.port + '/';
    this.nc = nats.connect({'servers': [server]});
    //console.log('nats server connect:' + server);
    var node = this;

    node.on('input', function(msg) {
      this.subject = msg.replyTo || msg.topic || config.subjec;
      this.message = msg.payload || config.message
      console.log('subject: ' + this.subject);

      if(this.subject){
        node.nc.request(this.subject, function(response) {
          console.log('Got a response in msg stream: ' + response);
          msg.payload = response
          node.send(msg);
        })
      }
    });

    this.on('close', function() {
      if (this.nc) {
        this.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-request",NatsRequestNode);
}
