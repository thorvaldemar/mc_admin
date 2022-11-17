const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const MinecraftServer = require('./MinecraftServer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const minecraft = new MinecraftServer(io);

const config = new (require('./config'))();

// Config exist security
app.use('/config', require('./pages/config/router'));
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
app.use('/home', require('./pages/home/router'));
app.use('/plugin', require('./pages/plugin/router'));

// If the site did not exist
app.use((req, res, next) => res.redirect('/home'));

server.listen(80, () => {
    console.log(`Listening to *:80`);
});

