const express = require('express');
const PageRoute = require('../../PageRoute');
const app = express.Router();

module.exports = class HomePage extends PageRoute {
    init() {
        this.app.get('/', (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });
        this.app.get('/app.js', (req, res) => res.sendFile(`${__dirname}/app.js`));
        this.app.get('/style.css', (req, res) => res.sendFile(`${__dirname}/style.css`));

        this.socketHandling();
    }

    socketHandling() {
        this.io.on('connection', socket => {
            if (this.minecraft.connectedToServer) socket.emit('service connect');
            else socket.emit('service disconnect');
            socket.emit('server status', this.minecraft.running ? 'start' : 'stop');
            socket.emit('server backlog', this.minecraft.backlog);

            this.minecraft.on('backLog', (log) => socket.emit('server backlog', log));
            this.minecraft.on('newLine', (str) => socket.emit('server newline', str));
            this.minecraft.on('start', () => socket.emit('server status', 'start'));
            this.minecraft.on('stop', () => socket.emit('server status', 'stop'));
            
            socket.on('server start', fn => {
                this.minecraft.emit('start', this.config.getConfig('server_folder'), this.config.getConfig('max_heap'), this.config.getConfig('max_memory'), fn);
            });

            socket.on('server stop', (delay, msg, fn) => {
                this.minecraft.emit('stop', delay, msg, fn);
            });

            socket.on('server write', (command, fn) => {
                this.minecraft.emit('write', command, fn)
            });

            this.minecraft.on('connect', () => socket.emit('service connect'));
            this.minecraft.on('disconnect', () => socket.emit('service disconnect'));
            socket.on('service start', fn => {
                if (typeof(fn) !== 'function') return this.minecraft.startService();
                fn(this.minecraft.startService());
            });
            // this.minecraft.on('pluginDisable', plugin => socket.emit('server pluginDisable', plugin));
        });
    }
}