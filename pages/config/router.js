const express = require('express');
const config = new (require('../../config'))();
const app = express.Router();

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.get('/save', (req, res) => {
    config.save(req.query);
    res.redirect('../home');
});

module.exports = app;