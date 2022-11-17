const { Server } = require("socket.io");
const process = require('child_process');
const config = new (require('./config'))();
const { Router } = require("express");
const Config = require("./config");

/**
 * @callback PluginDisableCallback
 * @param {string} plugin
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
        this.socketHandler();

        /** @type {Array<PluginDisableCallback>} */
        this.pluginDisableListeners = [];

        /** @type {process.ChildProcessWithoutNullStreams} */
        this.minecraft = process.spawn('java', ['-Xms2G', '-Xmx2G', '-XX:+UseG1GC', '-jar', `${this.config.getConfig('server_folder')}/spigot.jar`, 'nogui'], {
            cwd: this.config.getConfig('server_folder'),
        });

        this.minecraft.stdout.on('data', data => {
            const output = data.toString('ascii');
            this.onStdOut(output);
        });
    }

    /**
     * @param {string} str 
     */
    onStdOut(str) {
        const disableSearch = [...str.matchAll(/\[Server thread\/INFO\]: \[[a-z0-9_\-]+\] Disabling ([a-z0-9_\-]+)/gi)];
        if (disableSearch.length > 0) this.pluginDisableListeners.forEach(listener => listener(disableSearch[0][1]));
        this.log.push(str);
        this.io.emit('minecraft newline', str);
    }

    /**
     * @param {PluginDisableCallback} callback 
     */
    onPluginDisable(callback = (plugin) => {}) {
        this.pluginDisableListeners.push(callback);
    }

    /**
     * @param {string} str 
     */
    write(str) {
        this.minecraft.stdin.write(`${str}\n`);
    }

    socketHandler() {
        this.io.on('connection', socket => {
            socket.emit('minecraft all', this.log);

            socket.on('minecraft write', command => {
                this.write(command);
            });
        });
    }
}