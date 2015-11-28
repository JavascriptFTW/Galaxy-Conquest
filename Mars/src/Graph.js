var Graph = (function() {
    
    let _ = require("./underscore-extended.js");
    
    let UIDGenerator = require("./UIDGenerator");
    
    const CALLBACK_UID_KEY = "_mars_graph_callback_uid";
    const CHANGE_UID_PREFIX = "mars_graph_change_uid_";
    let uidGenerator = new UIDGenerator({
        sequenceLength: 30
    });
    
    class GraphObject {
        constructor({data = {}, listen = {}, verify = {}, change = {}}) {
            this._listeners = {};
            this._data = {};
            this._checks = {};
            this._dataListeners = {};
            
            for (let evt in listen) {
                if (listen.hasOwnProperty(evt)) {
                    this.on(evt, listen[evt]);
                }
            }
            this.data(data);
            this.verify(verify);
            this.process(change);
        }
        _callbackify(callback) {
            if (typeof callback === "function") {
                if (!callback[CALLBACK_UID_KEY]) {
                    callback[CALLBACK_UID_KEY] = uidGenerator.generate();
                }
            } else if(callback.constructor === Array) {
                callback.map(fn => {
                    if (!fn[CALLBACK_UID_KEY]) {
                        fn[CALLBACK_UID_KEY] = uidGenerator.generate();
                    }
                })
            }
        }
        /*
         Description:
            Adds one or more event listeners to this object
         Usage:
            on(event, callback)
                Adds `callback` as a listener for the `event` event
            on(event, callbacks)
                Adds all methods within the `callbacks` array as listeners
                for the `event` event
            on(json)
                Uses a `json` object where the keys are event names and the
                values are event listeners (or arrays of listeners) and Adds
                them
         */
        on(...args) {
            if (args.length === 1) {
                return this._onJSON.apply(this, args);
            }
            if (args.length >= 2) {
                return this._onEvtCallback.apply(this, args);
            }
            return this;
        }
        _onJSON(json) {
            if (typeof json !== "object") {
                return this;
            }
            
            for (let evt in json) {
                if (json.hasOwnProperty(evt)) {
                    this._onEvtCallback(evt, json[evt]);
                }
            }
            
            return this;
        }
        _onEvtCallback(evt, callback) {
            if (typeof evt !== "string" ||
                (typeof callback !== "function" && callback.constructor !== Array)) {
                return this;
            }
            
            if (typeof this._listeners[evt] === "undefined" ||
                this._listeners[evt].constructor !== Array) {
                this._listeners[evt] = [];
            }
            
            if (typeof callback === "function") {
                callback[CALLBACK_UID_KEY] = uidGenerator.generate();
                this._listeners[evt].push(callback);
            } else if(callback.constructor === Array) {
                for (let listener of callback) {
                    this._onEvtCallback(evt, listener);
                }
            }
            
            return this;
        }
        /*
         Description:
            Unbinds one or more event listeners from an object
         Usage:
            off(event, listener)
                Removes the listener on the `event` event matching `listener`
                (if any)
            off(event, listeners)
                Unbinds all listeners within the `listeners` array from the
                `event` event
            off(json)
                Uses a JSON object where the keys are event names and the values
                are event listeners (or groups of them) and remove all listeners
                from their respective events
         */
        off(...args) {
            if (args.length === 1) {
                return this._offJSON.apply(this, args);
            }
            if (args.length >= 2) {
                return this._offEvtCallback.apply(this, args);
            }
            return this;
        }
        _offJSON(json) {
            if (typeof json !== "object") {
                return this;
            }
            
            for (let evt in json) {
                if (json.hasOwnProperty(evt)) {
                    this._offEvtCallback(evt, json[evt]);
                }
            }
            
            return this;
        }
        _offEvtCallback(evt, callback) {
            if (this._listeners[evt] === undefined) {
                return this;
            }
            
            if (typeof callback === "function") {
                if (!callback[CALLBACK_UID_KEY]) {
                    return this;
                }
                let callbackUid = callback[CALLBACK_UID_KEY];
                let filtered = this._listeners[evt].filter(val => {
                    return (val[CALLBACK_UID_KEY] !== callbackUid);
                });
                
                if (!filtered.length) {
                    delete this._listeners[evt];
                } else {
                    this._listeners[evt] = filtered;
                }
            } else if (callback.constructor === Array) {
                for (let listener of callback) {
                    this._offEvtCallback(evt, listener);
                }
            }
            
            return this;
        }
        /*
         Description:
            Fires one or more events with optional data
         Usage:
            fire(event, data)
                Fires the `event` event passing the `data` object to it
            fire(events, data)
                Fires all events in `events` passing the data object to them
            fire(json)
                `json` is a JSON object containing the names of events as keys
                and the data to pass to them when fired as values
         */
        fire(...args) {
            if (!args.length) {
                return this;
            }
            
            if (args.length === 1 && typeof args[0] === "object" &&
                args[0].constructor !== Array) {
                return this._fireJSON.apply(this, args);
            }
            if (args[0].constructor === Array) {
                return this._fireEvents.apply(this, args);
            }
            if (typeof args[0] === "string") {
                return this._fireEvent.apply(this, args);
            }
            
            return this;
        }
        _fireJSON(json) {
            for (let eventName in json) {
                if (json.hasOwnProperty(eventName)) {
                    this._fireEvent(eventName, json[eventName]);
                }
            }
            return this;
        }
        _fireEvents(eventNames, data) {
            for (let eventName of eventNames) {
                this._fireEvent(eventName, data);
            }
            return this;
        }
        _fireEvent(eventName, data) {
            if (this._listeners.hasOwnProperty(eventName)) {
                for (let listener of this._listeners[eventName]) {
                    listener(data);
                }
            }
            return this;
        }
        data() {
            if (arguments.length === 1) {
                let dat = arguments[0];
                this._data = _.merge(this._data, dat);
            } else if (arguments.length >= 2) {
                let [key, value] = arguments;
                key = key.split(".");
                let ref = this._data;
                while (key.length > 1 && ref !== undefined) {
                    ref = ref[key.shift()];
                }
                if (ref !== undefined) {
                    ref[key.shift()] = value;
                }
            }
            return this._data;
        }
        process(...args) {
            if (args.length === 1) {
                this._processJSON.apply(this, args);
            } else if (args.length === 2) {
                this._processKeyValue.apply(this, args);
            }
            return this;
        }
        _processJSON(json, path = "") {
            for (let key in json) {
                if (json.hasOwnProperty(key)) {
                    let valPath = path;
                    if (valPath.length) {
                        valPath += ".";
                    }
                    valPath += key;
                    
                    if (_.isFunction(json[key]) || _.isArray(json[key])) {
                        this._processKeyValue(valPath, json[key]);
                    } else if (_.isObject(json[key])) {
                        this._processJSON(json[key], valPath);
                    }
                }
            }
        }
        _processKeyValue(key, listeners) {
            if (typeof key !== "string") {
                return this;
            }
            
            if (listeners.constructor !== Array) {
                listeners = [listeners];
            }
            
            listeners = listeners.filter(val => {
                return _.isFunction(val);
            });
            
            let path = key;
            
            let setKey = `${CHANGE_UID_PREFIX}${path}_set`;
            let getKey = `${CHANGE_UID_PREFIX}${path}_get`;
            let verifyKey = `${CHANGE_UID_PREFIX}${path}_verify`;
            
            if (this._checks[verifyKey] === undefined) {
                this._checks[verifyKey] = [];
            }
            if (this._checks[getKey] === undefined) {
                this._checks[getKey] = [];
            }
            
            if (this._dataListeners[setKey] !== undefined) {
                this._dataListeners[setKey].push.apply(
                    this._dataListeners[setKey], listeners);
            } else {
                this._dataListeners[setKey] = listeners;
                
                key = key.split(".");
                let ref = this._data;
                
                while(key.length > 1 && ref !== undefined) {
                    ref = ref[key.shift()];
                }
                
                if (ref !== undefined) {
                    key = key.shift();
                    
                    this._attachAccessors(ref, key, path, [
                        getKey,
                        setKey,
                        verifyKey
                    ]);
                }
            }
        }
        _attachAccessors(ref, key, path, [getKey, setKey, verifyKey]) {
            let val = ref[key];
            
            Object.defineProperty(ref, key, {
                set: (function(nVal) {
                    if (this._checks[verifyKey] !== undefined) {
                        for (let check of this._checks[verifyKey]) {
                            if (!check(nVal)) {
                                return;
                            }
                        }
                    }
                    
                    if (this._dataListeners[setKey] !== undefined) {
                        for (let processor of this._dataListeners[setKey]) {
                            let possible = processor(nVal);
                            
                            if (possible !== undefined) {
                                nVal = possible;
                            }
                        }
                    }
                    
                    val = nVal;
                }).bind(this),
                get: (function() {
                    let retVal = val;
                    
                    if (this._dataListeners[getKey] !== undefined) {
                        for (fetcher of this._dataListeners[getKey]) {
                            retVal = fetchers(val);
                        }
                    }
                    
                    return retVal;
                }).bind(this)
            })
        }
        fetch() {
            
        }
        processSet() {
            
        }
        verify(checks) {
            _.mapObject(checks, function(value, key) {
                
            });
            return this;
        }
    }
    
    class Graph extends GraphObject {
        constructor(cfg = {}) {
            super(cfg);
        }
    }
    
    
    
    class Node extends GraphObject {
        constructor(cfg = {}) {
            super(cfg);
        }
    }
    
    
    
    class Edge extends GraphObject {
        constructor(cfg = {}) {
            super(cfg);
        }
        connect() {
            
        }
        unconnect() {
            
        }
    }
    
    
    
    Graph.Node = Node;
    Graph.Edge = Edge;
    
    module.exports = Graph;
    return Graph;
    
})();
