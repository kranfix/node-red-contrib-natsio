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

    var sid = this.nc.subscribe(this.subject,  function(message, reply, subject) {
      //console.log('subject: ' + subject + 'message: ' + message);
      var msg = {payload: ''};
      msg.payload = {
        'subject': subject,
        'message': message
      }
      node.send(msg);
    });

    this.on('close', function() {
      if (this.nc) {
        this.nc.unsubscribe(this.subject,sid);
        this.nc.close();
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
      this.subject = msg.payload.subject || config.subject;
      this.message = msg.payload.message || config.message;
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

    this.on('input', function(msg) {
      this.subject = msg.topic || config.subjec;
      console.log('subject: ' + this.subject);

      if(this.subject){
        console.log('Hi: '+this.subject);
        this.nc.request(this.subject, function(response) {
          console.log('Got a response in msg stream: ' + response);
          node.send(msg);
        })
        this.nc.publish(this.subject, this.message);
      }
    });

    this.on('close', function() {
      if (this.nc) {
        this.nc.close();
      }
    });
  }
  RED.nodes.registerType("nats-request",NatsRequestNode);

  function NatsReplyNode(config) {
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
      this.subject = msg.payload.subject || config.subject;
      this.message = msg.payload.message || config.message;
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
  RED.nodes.registerType("nats-reply",NatsPubNode);
}
