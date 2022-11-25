const { io } = require('socket.io-client');
const socket = io('http://localhost:28569');

socket.on('connect', () => console.log('Connected'));