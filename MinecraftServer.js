const { Server, Socket } = require('socket.io');
const { io } = require('socket.io-client');
const Config = require('./config');
const process = require('child_process');

/**
 * @typedef {Object} Listeners
 * @property {Array<PluginDisableCallback>} pluginDisable
 * @property {Array<ServerStartCallback>} start
 * @property {Array<ServerStopCallback>} stop
 * @property {Array<ConsoleNewLineCallback>} newLine
 * @property {Array<ConsoleBackLogCallback>} backLog
 * @property {Array<ServiceConnectCallbkack>} connect
 * @property {Array<ServiceDisconnectCallbkack>} disconnect
 */

/**
 * @callback PluginDisableCallback
 * @param {string} plugin
 */

/**
 * @callback ServerStartCallback
 */

/**
 * @callback ServerStopCallback
 * @param {number|null} exitCode
 */

/**
 * @callback ConsoleNewLineCallback
 * @param {string} str
 */

/**
 * @callback ConsoleBackLogCallback
 * @param {Array<string>} log
 */

/**
 * @callback ServiceDisconnectCallbkack
 */

/**
 * @callback ServiceConnectCallbkack
 */

module.exports = class MinecraftServer {
    /**
     * @param {Config} config 
     */
    constructor(config) {
        /** @type {Config} */
        this.config = config;

        /** @type {Socket} */
        this.minecraft = io('http://localhost:28569');

        /** @type {boolean} */
        this.connectedToServer = false;

        /** @type {boolean} */
        this.kickstarting = false;

        /** @type {boolean} */
        this.running = false;

        /** @type {Listeners} */
        this.listeners = { pluginDisable: [], start: [], stop: [], newLine: [], backLog: [], connect: [], disconnect: [] };

        /** @type {Array<string>} */
        this.backlog = [];

        this.serverHandler();
    }

    /**
     * @param {'pluginDisable'|'start'|'stop'|'newLine'|'backLog'|'connect'|'disconnect'} event 
     * @param  {...any} args 
     */
    #emitEvent(event, ...args) {
        this.listeners[event].forEach(e => e(...args));
    }

    /**
     * @param {'pluginDisable'|'start'|'stop'|'newLine'|'backLog'|'connect'|'disconnect'} event 
     * @param  {PluginDisableCallback|ServerStartCallback|ServerStopCallback|ConsoleNewLineCallback|ConsoleBackLogCallback|ServiceConnectCallbkack|ServiceDisconnectCallbkack} callback 
     */
    on(event, callback) {
        this.listeners[event].push(callback);
    }

    /**
     * @param {string} event 
     * @param  {...any} args 
     */
    emit(event, ...args) {
        if (!this.connectedToServer) return;
        this.minecraft.emit(event, ...args);
    }

    startService() {
        console.log(this.connectedToServer);
        if (this.connectedToServer) return {success: false, error: true, reason: "The service is already running"};
        if (this.kickstarting) return {success: false, error: true, reason: "Already trying to start the service"};
        this.kickstarting = true;
        const kickstarter = process.spawn('node', ['index.js'], {
            cwd: `${__dirname}/serverHandler`,
            detached: true,
            stdio: ['ignore'],
        });
        kickstarter.unref();
        return {success: true, error: false, reason: null};
    }

    stopService() {
        if (!this.connectedToServer) return {success: false, error: true, reason: "The service is not running"};
        this.minecraft.emit('service stop');
        return {success: true, error: false, reason: null};
    }

    serverHandler() {
        this.minecraft.on('connect', () => {
            console.log("Connected to service");
            this.kickstarting = false;
            this.connectedToServer = true;
            this.#emitEvent('connect');
        });
        this.minecraft.on('disconnect', () => {
            console.log("Lost connection to service");
            this.connectedToServer = false;
            this.#emitEvent('disconnect');
        });
        this.minecraft.on('started', () => {
            this.running = true;
            this.#emitEvent('start');
        });
        this.minecraft.on('stopped', code => {
            this.running = false;
            this.#emitEvent('stop', code);
        });
        this.minecraft.on('disable', plugin => this.#emitEvent('pluginDisable', plugin));
        this.minecraft.on('backlog', log => {
            this.backlog = log;
            this.#emitEvent('backLog', log);
        });
        this.minecraft.on('newline', str => {
            this.backlog.push(str);
            this.#emitEvent('newLine', str);
        });
    }
}

// const { Server } = require("socket.io");
// const process = require('child_process');
// const config = new (require('./config'))();
// const { Router } = require("express");
// const Config = require("./config");

// /**
//  * @typedef {Object} Listeners
//  * @property {Array<PluginDisableCallback>} pluginDisable
//  * @property {Array<ServerStartCallback>} start
//  * @property {Array<ServerStopCallback>} stop
//  */

// /**
//  * @callback PluginDisableCallback
//  * @param {string} plugin
//  */

// /**
//  * @callback ServerStartCallback
//  */

// /**
//  * @callback ServerStopCallback
//  * @param {number|null} exitCode
//  */

// module.exports = class MinecraftServer {
//     /**
//      * @param {Server} io 
//      * @param {Config} config
//      */
//     constructor(io, config) {
//         /** @type {Server} */
//         this.io = io;

//         /** @type {Config} */
//         this.config = config;

//         /** @type {Array<string>} */
//         this.log = [];
        
//         /** @type {Listeners} */
//         this.listeners = { pluginDisable: [], start: [], stop: [], };

//         /** @type {process.ChildProcessWithoutNullStreams} */
//         this.minecraft = null;

//         this.socketHandler();
//     }

//     isRunning() {
//         return !!this.minecraft;
//     }

//     startServer() {
//         if (this.minecraft) return;
//         this.minecraft = process.spawn('java', [
//             `-Xms${this.config.getConfig('max_heap')}G`,
//             `-Xmx${this.config.getConfig('max_memory')}G`,
//             '-XX:+UseG1GC',
//             '-jar',
//             `${this.config.getConfig('server_folder')}/spigot.jar`,
//             'nogui'
//         ], {
//             cwd: this.config.getConfig('server_folder'),
//         });

//         this.minecraft.on('spawn', () => {
//             this.listeners.start.forEach(cb => cb());
//         });

//         this.minecraft.stdout.on('data', data => {
//             const output = data.toString('ascii');
//             this.onStdOut(output);
//         });

//         this.minecraft.on('exit', code => {
//             this.minecraft.stdout.removeAllListeners();
//             this.minecraft.kill();
//             this.stopping = false;
//             this.listeners.stop.forEach(cb => cb(code));
//             this.minecraft = null;
//         });
//     }

//     /**
//      * @param {number} delay - Seconds to stop
//      * @param {string} msg - Message to broadcast
//      */
//     stopServer(delay = 0, msg = "We are stopping the server in %s seconds") {
//         if (!this.minecraft || this.stopping) return;
//         this.stopping = true;
//         if (delay > 0) {
//             this.write(`say ${msg.replace(/%0/g, delay)}`);
//             setTimeout(() => this.write("stop"), delay * 1000);
//             return;
//         }
//         this.write("stop");
//     }

//     /**
//      * @param {string} str 
//      */
//     onStdOut(str) {
//         const disableSearch = [...str.matchAll(/\[Server thread\/INFO\]: \[[a-z0-9_\-]+\] Disabling ([a-z0-9_\-]+)/gi)];
//         if (disableSearch.length > 0) this.listeners.pluginDisable.forEach(listener => listener(disableSearch[0][1]));
//         this.log.push(str);
//         this.io.emit('minecraft newline', str);
//     }

//     /**
//      * @param {PluginDisableCallback} callback 
//      */
//     onPluginDisable(callback = (plugin) => {}) {
//         this.listeners.pluginDisable.push(callback);
//     }

//     /**
//      * @param {ServerStopCallback} callback 
//      */
//     onServerStop(callback = (exitCode) => {}) {
//         this.listeners.stop.push(callback);
//     }

//     /**
//      * @param {ServerStartCallback} callback 
//      */
//     onServerStart(callback = () => {}) {
//         this.listeners.start.push(callback);
//     }

//     /**
//      * @param {string} str 
//      */
//     write(str) {
//         if (!this.minecraft) return;
//         this.minecraft.stdin.write(`${str}\n`);
//     }

//     socketHandler() {
//         this.onServerStart(() => this.io.emit('minecraft status', 'running'));
//         this.onServerStop((code) => this.io.emit('minecraft status', 'stopped'));

//         this.io.on('connection', socket => {
//             this.io.emit('minecraft status', this.isRunning() ? 'running' : 'stopped');
//             socket.emit('minecraft all', this.log);

//             socket.on('minecraft write', command => {
//                 this.write(command);
//             });

//             socket.on('minecraft stop', () => this.stopServer());
//             socket.on('minecraft start', () => this.startServer());
//         });
//     }
// }