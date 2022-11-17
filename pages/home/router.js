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
    }
}