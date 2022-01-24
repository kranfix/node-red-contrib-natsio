var nats = require('nats');

var ContextStore = function (config) {
    var defaultOptions = {
        debug: false,
        servers: ["localhost:4222"],
        bucket: "nodered-context",
        kv: {
            replicas: 1,
            history: 0,
            timeout: 0,
            maxBucketSize: 0,
            maxValueSize: 0,
            placementCluster: null,
            mirrorBucket: null,
            ttl: 0,
            streamName: null,
            storage: "file",
        }
    };

    const kv = !config.kv ? defaultOptions.kv  :  Object.assign(defaultOptions.kv , config.kv )
    var options = Object.assign(defaultOptions, config)
    options.kv=kv
    console.log(nats);
    this.config = options;
    this.nc = null;
    this.kv = null;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();

}


function toNatsScope(k) {
    if (!k || k=="global" ) {
        return k;
    }

    if (k.indexOf(":") == -1)  {
        return "flow."  + k;
    }

    return k.replace(':','.');
}

ContextStore.prototype.open = async function () {
    const self = this;

    const promise = new Promise((resolve, reject) => {
        async function connect() {
            console.debug("nats-context: connect");
            nats.connect({
                'servers': self.config.servers,
                'maxReconnectAttempts': -1,
                'reconnectTimeWait': 250,
                'timeout': 5000,
                'json': true,
                'name': "node-red-context",
                'debug': self.config.debug,
                'pass': self.config.password,
                'user': self.config.username,
            }).then((nc) => {
                self.nc = nc;


                // make sure the bucket exists
                const js = self.nc.jetstream();
                js.views.kv(self.config.bucket, self.config.kv).then((kv) => {
                    self.kv = kv;
                    console.info("nats-context: connected");
                    resolve();
                }).catch((reason) => {
                    reject(reason);
                });

                let statusEnum = self.nc.status();
                (async function () {
                    console.debug("nats-context-status: wait status changes");
                    for await (let st of statusEnum) {
                        console.log("nats-context-status: " + st.type);
                        switch (st.type) {
                            case "disconnect":
                                self.nc = null;
                                break;
                            case "error":
                                break;
                            case "connect":
                                break;
                            case "reconnecting":
                                break;
                            case "update":
                                break;
                            case "close":
                                self.nc = null;
                                break;
                        }
                    }
                })();
                console.debug("nats-context-status: wait for connection");
            }).catch((reason) => {
                if (reason != "TIMEOUT") {
                    console.log("nats-context-error", reason)
                } else {
                    console.error("nats-context-error", reason)
                }
                reject(reason);
            })
        }
        connect();
    });
    console.log("nats-context-status: initialized");
    return promise;
}

ContextStore.prototype.close = function () {
    if (this.nc != null) {
        this.nc.close();
    }
}


ContextStore.prototype.check = function (callback) {
    if (this.nc == null) {
        if (callback) {
            callback("nats-context not connected")
            return false
        }
    }
    if (this.kv == null) {
        if (callback) {
            callback("nats-context not configured")
            return false
        }
    }
    return true;
}


ContextStore.prototype.get = function (scope, key, callback) {
    console.info("GET", scope, key);
    if (!this.check(callback)) {
        return
    }
    const subject = toNatsScope(scope) + "." + key;
    this.kv.get(subject).then((v) => {
        if (!v || v==null) {
            if  (callback) {
                callback(null, v);
            }
            return v
        }

        if (v.operation == "PURGE") {
            console.debug("nats-context-Get", scope,key, subject, "PURGED");
            if (callback) {
                callback(null, undefined);
            }
            return undefined
        }

        var val;
        const decoded  = this.decoder.decode(v.value);
        try {
            val = JSON.parse(decoded);
        } catch (e) {
            console.warn("decode context value", e)
            val = decoded;
        }
        console.debug("nats-context-Get", scope,key, subject, val,  decoded);

        if (callback) {
            callback(null, val);
        }
        return val;
    }).catch((e) => {
        if (callback) {
            callback(e);
        }
        throw e;
    });
}

ContextStore.prototype.setArray = function (scope, keys, values, callback) {
    if (!this.check(callback)) {
        return
    }
    throw "NOT YET IMPLEMENTED";

    for (var i=0; i < length(keys); i++) {
        const key = keys[i];
        const subject = toNatsScope(scope) + "." + key;
        if (value == undefined) {
            // delete...
            this.kv.purge(subject).then(() => {
                console.debug("nats-context-delete", scope,key);
                if (callback) {
                    callback();
                }
                return
            }).catch((e) => {
                if (callback) {
                    callback(e)
                }
            });
            return
        }
        const encodedValue = this.encoder.encode(JSON.stringify(value));
        this.kv.put(subject, encodedValue).then((n) => {
            console.debug("nats-context-set", scope, key,subject);
            return
        }).catch((e) => {
            if (callback) {
                callback(e)
            }
        });
    }

    if (callback) {
        callback();
    }
}

ContextStore.prototype.set = function (scope, key, value, callback) {
    console.info("SET", scope, key, value);
    if (!this.check(callback)) {
        return
    }

    if (key instanceof Array) {
        return this.setArray(scope, key,value, callback) ;
    }
    
    const subject = toNatsScope(scope) + "." + key;
    if (value == undefined) {
        // delete...
        this.kv.purge(subject).then(() => {
            console.debug("nats-context-delete", scope,key);
            if (callback) {
                callback();c
            }
            return
        }).catch((e) => {
            if (callback) {
                callback(e)
            }
        });
        return
    }
    const jsonVal = JSON.stringify(value);
    const encodedValue = this.encoder.encode(jsonVal);
    this.kv.put(subject, encodedValue).then((n) => {
        console.debug("nats-context-Set", scope,key,subject), jsonVal;
        if (callback) {
            callback();
        }
        return
    }).catch((e) => {
        if (callback) {
            callback(e)
        }
    });
}

ContextStore.prototype.keys = function (scope, callback) {
    if (!this.check(callback)) {
        return
    }

    if (!callback) {
        throw "this store only supports async operations";
    }

    const subject = scope + ".>";
    this.kv.keys(subject).then((keys) => {
        const buf = [];
        (async () => {
            for await (const k of keys) {
                buf.push(k.substring(scope.length+1));
            }
            if (callback) {
                callback(null, buf);
            }
            return
        })();

    }).catch((e) => {
        if (callback) {
            callback(e)
        }
    });
}

ContextStore.prototype.delete = function (scope) {
    console.info("DELETE", scope);
    if (!this.check()) {
        return
    }
    const subject = scope + ".>";
    (async function () {
        await this.kv.purge(subject);
    })();
}

ContextStore.prototype.clean = function (_activeNodes) {
    if (!this.check()) {
        return
    }
    var activeNodes = {};
    _activeNodes.forEach(function(node) { activeNodes[toNatsScope(node)] = true });

    const subject = ">";
    this.kv.keys(subject).then((keys) => {
        (async () => {
            for await (const k of keys) {
                if (k.startsWith("global.")) {
                    // allways keep global
                    continue;
                }
                if (!activeNodes.hasOwnProperty(k)) {
                    console.debug("cleaning up", k);
                    await this.kv.purge(k);
                }
            }
        })();

    }).catch((e) => {
        console.warn("nats-context-clean problem cleaning up", e)
    });



    console.log("nats-context-clean")
}

module.exports = function (config) {
    return new ContextStore(config);
};

