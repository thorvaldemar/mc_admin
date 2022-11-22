const { Server } = require("socket.io");
const process = require('child_process');
const config = new (require('./config'))();
const { Router } = require("express");
const Config = require("./config");

/**
 * @typedef {Object} Listeners
 * @property {Array<PluginDisableCallback>} pluginDisable
 * @property {Array<ServerStartCallback>} start
 * @property {Array<ServerStopCallback>} stop
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

module.exports = class MinecraftServer {
    /**
     * @param {Server} io 
     * @param {Config} config
     */
    constructor(io, config) {
        /** @type {Server} */
        this.io = io;

        /** @type {Config} */
        this.config = config;

        /** @type {Array<string>} */
        this.log = [];
        
        /** @type {Listeners} */
        this.listeners = { pluginDisable: [], start: [], stop: [], };

        /** @type {process.ChildProcessWithoutNullStreams} */
        this.minecraft = null;

        this.socketHandler();
    }

    isRunning() {
        return !!this.minecraft;
    }

    startServer() {
        if (this.minecraft) return;
        this.minecraft = process.spawn('java', [
            `-Xms${this.config.getConfig('max_heap')}G`,
            `-Xmx${this.config.getConfig('max_memory')}G`,
            '-XX:+UseG1GC',
            '-jar',
            `${this.config.getConfig('server_folder')}/spigot.jar`,
            'nogui'
        ], {
            cwd: this.config.getConfig('server_folder'),
        });

        this.minecraft.on('spawn', () => {
            this.listeners.start.forEach(cb => cb());
        });

        this.minecraft.stdout.on('data', data => {
            const output = data.toString('ascii');
            this.onStdOut(output);
        });

        this.minecraft.on('exit', code => {
            this.minecraft.stdout.removeAllListeners();
            this.minecraft.kill();
            this.stopping = false;
            this.listeners.stop.forEach(cb => cb(code));
            this.minecraft = null;
        });
    }

    /**
     * @param {number} delay - Seconds to stop
     * @param {string} msg - Message to broadcast
     */
    stopServer(delay = 0, msg = "We are stopping the server in %s seconds") {
        if (!this.minecraft || this.stopping) return;
        this.stopping = true;
        if (delay > 0) {
            this.write(`say ${msg.replace(/%0/g, delay)}`);
            setTimeout(() => this.write("stop"), delay * 1000);
            return;
        }
        this.write("stop");
    }

    /**
     * @param {string} str 
     */
    onStdOut(str) {
        const disableSearch = [...str.matchAll(/\[Server thread\/INFO\]: \[[a-z0-9_\-]+\] Disabling ([a-z0-9_\-]+)/gi)];
        if (disableSearch.length > 0) this.listeners.pluginDisable.forEach(listener => listener(disableSearch[0][1]));
        this.log.push(str);
        this.io.emit('minecraft newline', str);
    }

    /**
     * @param {PluginDisableCallback} callback 
     */
    onPluginDisable(callback = (plugin) => {}) {
        this.listeners.pluginDisable.push(callback);
    }

    /**
     * @param {ServerStopCallback} callback 
     */
    onServerStop(callback = (exitCode) => {}) {
        this.listeners.stop.push(callback);
    }

    /**
     * @param {ServerStartCallback} callback 
     */
    onServerStart(callback = () => {}) {
        this.listeners.start.push(callback);
    }

    /**
     * @param {string} str 
     */
    write(str) {
        if (!this.minecraft) return;
        this.minecraft.stdin.write(`${str}\n`);
    }

    socketHandler() {
        this.onServerStart(() => this.io.emit('minecraft status', 'running'));
        this.onServerStop((code) => this.io.emit('minecraft status', 'stopped'));

        this.io.on('connection', socket => {
            this.io.emit('minecraft status', this.isRunning() ? 'running' : 'stopped');
            socket.emit('minecraft all', this.log);

            socket.on('minecraft write', command => {
                this.write(command);
            });

            socket.on('minecraft stop', () => this.stopServer());
            socket.on('minecraft start', () => this.startServer());
        });
    }
}