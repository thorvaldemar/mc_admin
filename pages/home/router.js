const express = require('express');
const app = express.Router();

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});
app.get('/app.js', (req, res) => res.sendFile(`${__dirname}/app.js`));

module.exports = app;