const PageRoute = require('../../PageRoute');

module.exports = class ConfigPage extends PageRoute {
    init() {
        this.app.get('/', (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });
        
        this.app.get('/save', (req, res) => {
            this.config.save(req.query);
            res.redirect('../home');
        });
    }
}