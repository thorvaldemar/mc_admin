const port = 28569;

const process = require('child_process');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const fs = require('fs');
const { exit, stdout } = require('process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/**********************************
 *          SERVICE API           *   
 **********************************/

/** @type {import('child_process').ChildProcessWithoutNullStreams} */
var minecraft = null;
var stopping = false;
var log = [];

function startServer(location, heap, memory) {
    if (minecraft) return { success: false, error: true, reason: "The server is already running" };
    log = [];

    const jarFile = fs.readdirSync(`C:\\Users\\thor0\\Desktop\\UltimateSurvival`).find(file => /.*spigot.*\.jar/.test(file));
    if (!jarFile) return { success: false, error: true, reason: "Could not find the server jar file" };

    minecraft = process.spawn('java', [
        `-Xms${heap}G`,
        `-Xmx${memory}G`,
        '-XX:+UseG1GC',
        '-jar',
        `${location}/${jarFile}`,
        'nogui'
    ], {
        cwd: location,
    });

    minecraft.on('spawn', () => {
        io.emit('started');
    });

    minecraft.stdout.on('data', data => {
        const output = data.toString('ascii');
        onStdOut(output);
    });

    minecraft.on('exit', code => {
        minecraft.stdout.removeAllListeners();
        minecraft.kill();
        stopping = false;
        minecraft = null;
        io.emit('stopped', code);
    });

    return { success: true, error: false, reason: null, heap: heap, memory: memory, location: location, jarFile: jarFile };
}

function stopServer(delay = 0, msg = "We are stopping the server in %s seconds") {
    if (!minecraft || stopping) return { success: false, error: true, reason: "The server is not running or is about to stop" };
    stopping = true;
    if (delay > 0) {
        write(`say ${msg.replace(/%0/g, delay)}`);
        setTimeout(() => write("stop"), delay * 1000);
        return { success: true, error: false, reason: null };
    }
    write("stop");
    return { success: true, error: false, reason: null };
}

function onStdOut(str) {
    stdout.write(str);
    const disableSearch = [...str.matchAll(/\[Server thread\/INFO\]: \[[a-z0-9_\-]+\] Disabling ([a-z0-9_\-]+)/gi)];
    log.push(str);
    io.emit('newline', str);
    if (disableSearch.length > 0) io.emit('disable', disableSearch[0][1])
}

function write(str) {
    if (!minecraft) return { success: false, error: true, reason: "The server is not running" };
    minecraft.stdin.write(`${str}\n`);
    return { success: true, error: false, reason: null };
}

io.on('connection', socket => {
    socket.emit('backlog', log);
    if (minecraft) socket.emit('started');
    else socket.emit('stopped');

    socket.onAny(event => console.log(`[DEBUG] SOCKET EVENT: ${event}`));

    socket.on('start', (location, heap, memory, fn) => {
        if (typeof(fn) !== 'function') return startServer(location || '', heap || 0, memory || 0);
        fn(startServer(location, heap, memory));
    });

    socket.on('stop', (delay, msg, fn) => {
        if (typeof(fn) !== 'function') return stopServer(delay || 0, msg || '');
        fn(stopServer(delay, msg));
    });

    socket.on('write', (command, fn) => {
        if (typeof(fn) !== 'function') return write(command || "");
        fn(write(command));
    });

    socket.on('service stop', () => {
        exit();
    });
});

/**********************************
 *            DATA API            *   
 **********************************/

const startTime = new Date();
const upSince = Date.now();
var lastRequest = null;
var firstRequest = null;

app.get('/test', (req, res) => res.sendFile(`${__dirname}/connectionTest.html`));
app.get('/', (req, res) => {
    res.send({
        running: true,
        startTime: startTime,
        upTimeMS: Date.now() - upSince,
        port: port,
        firstRequest: firstRequest,
        lastRequest: lastRequest,
        connections: [...io.sockets.sockets].length,
    });
    lastRequest = new Date();
    if (!firstRequest) firstRequest = lastRequest;
});

server.listen(port, () => {
    console.log(`Server starting and listening to *:${port}`);
});