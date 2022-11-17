const { Server } = require("socket.io");
const process = require('child_process');
const config = new (require('./config'))();

module.exports = class MinecraftServer {
    /**
     * @param {Server} io 
     */
    constructor(io) {
        /** @type {Server} */
        this.io = io;

        /** @type {Array<string>} */
        this.log = [];
        this.socketHandler();

        /** @type {process.ChildProcessWithoutNullStreams} */
        this.minecraft = process.spawn('java', ['-Xms2G', '-Xmx2G', '-XX:+UseG1GC', '-jar', `${config.getConfig('server_folder')}/spigot.jar`, 'nogui'], {
            cwd: config.getConfig('server_folder'),
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
        this.log.push(str);
        this.io.emit('minecraft newline', str);
    }

    /**
     * @param {string} str 
     */
    write(str) {

    }

    socketHandler() {
        this.io.on('connection', socket => {
            socket.emit('minecraft all', this.log);
        });
    }
}