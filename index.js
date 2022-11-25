const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const MinecraftServer = require('./MinecraftServer');
const PluginManager = require('./pluginManager');

const config = new (require('./config'))();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const minecraft = new MinecraftServer(config);

PluginManager._clearPluginData();

// Config exist security
app.use('/config', new (require('./pages/config/router'))(config).app);
app.use((req, res, next) => {
    if (!config.configExists())
        return res.redirect('/config');
    next();
});

app.use(require('express-fileupload')());

// Essentials
app.get('/header.js', (req, res) => res.sendFile(`${__dirname}/header.js`));
app.post('/topmenu', (req, res) => res.sendFile(`${__dirname}/topmenu.html`));
app.get('/main.css', (req, res) => res.sendFile(`${__dirname}/main.css`));

// Pages
app.use('/home', new (require('./pages/home/router'))(config, minecraft, io).app);
app.use('/plugin', new (require('./pages/plugin/router'))(config, null, io).app);

// If the site did not exist
app.use((req, res, next) => res.redirect('/home'));

server.listen(80, () => {
    console.log(`Listening to *:80`);
});

