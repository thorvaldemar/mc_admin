const express = require('express');
const http = require('http');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const fs = require('fs');
const decompress = require('decompress');
const YAML = require('js-yaml');

const app = express();
const server = http.createServer(app);

const config = new (require('./config'))(`${__dirname}/config.json`);

app.use(require('express-fileupload')());

app.get('/', async (req, res) => {
    const dom = new JSDOM(fs.readFileSync(`${__dirname}/index.html`, 'ascii'));
    const $ = jquery(dom.window);

    const plugins = await pl_get_list(`${config.server_folder}/plugins`);
    plugins.forEach(pl => $('#plugins').append(`<li>${pl}</li>`));

    res.send(dom.serialize());
});

app.post('/plugin/upload', (req, res) => {
    if (!req.files || !req.files.plugin) return res.send({success: false, error: true, reason: "No plugin file was attached"});
    if (req.files.plugin.name.split('.').pop() != 'jar') return res.send({success: false, error: true, reason: "File is not a .jar type"});
    req.files.plugin.mv(`${config.server_folder}/plugins/${req.files.plugin.name}`, (err) => { if (err) console.log(err); });
    res.redirect('/');
});

app.listen(80, () => {
    console.log(`Listening to *:80`);
});

function pl_get_list(path) {
    return new Promise(async (resolve, reject) => {
        var arr = [];
        
        for (const pl of fs.readdirSync(path)) {
            if (pl.split('.').pop().toLowerCase() !== 'jar') continue;
            const name = await pl_get_name(`${config.server_folder}/plugins/${pl}`);
            arr.push(name);
        }

        resolve(arr);
    });
}

/**
 * @param {string} path 
 * @returns {Promise<string>}
 */
function pl_get_name(path) {
    return new Promise((resolve, reject) => {
        decompress(path, { filter: file => /.*plugin.yml/.test(file.path), }).then(files => {
            resolve(YAML.load(files[0].data.toString('ascii')).name);
        }).catch(err => reject(err));
    });
}