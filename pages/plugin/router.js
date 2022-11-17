const fs = require('fs');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const PluginManager = require('../../pluginManager');
const config = new (require('../../config'))();
const express = require('express');
const app = express.Router();

app.get('/', async (req, res) => {
    const dom = new JSDOM(fs.readFileSync(`${__dirname}/index.html`, 'ascii'));
    const $ = jquery(dom.window);

    const t = Date.now();
    const plugins = await PluginManager.getList(`${config.getConfig('server_folder')}/plugins`);
    plugins.forEach(pl => $('.plugins').append(`
        <li class="plugin">
            <div class="options">
                <i class="bi bi-toggle-on" id="switch" title="Enable/disable"></i>
                <!-- <i class="bi bi-pen" id="edit" title="Edit"></i> -->
                <i class="bi bi-trash3" id="delete" title="Delete"></i>
            </div>
            <p id="name">${pl.name}</p>
            <p id="version">${pl.version}</p>
        </li>
    `));

    if (req.query.success) $('#upload-status').append(`<p style="color: green">${req.query.success}</p>`);
    if (req.query.err) $('#upload-status').append(`<p style="color: red">${req.query.err}</p>`);

    res.send(dom.serialize());
});
app.get('/style.css', (req, res) => res.sendFile(`${__dirname}/style.css`));
app.get('/app.js', (req, res) => res.sendFile(`${__dirname}/app.js`));

app.post('/upload', (req, res) => {
    const plugin_path = `${config.getConfig('server_folder')}/plugins/${req.files.plugin.name}`;
    if (!req.files || !req.files.plugin) return response('err', "No plugin file was attached"); // res.send({success: false, error: true, reason: "No plugin file was attached"});
    if (req.files.plugin.name.split('.').pop() != 'jar') return response('err', "File is not a .jar type"); // res.send({success: false, error: true, reason: "File is not a .jar type"});
    if (fs.existsSync(plugin_path)) return response('err', "The plugin file already exists"); // res.send({success: false, error: true, reason: "The plugin file already exists"});
    PluginManager.getRawPluginInfo(req.files.plugin.data).then(pl_info => {
        const pl_list = PluginManager.getPluginList();
        for (const e of Object.keys(pl_list))
            if (pl_list[e].name == pl_info.name) return response('err', "A plugin with the same name already exists"); // res.send({success: false, error: true, reason: "A plugin with the same name already exists"});

        req.files.plugin.mv(plugin_path, (err) => {
            if (err) return res.send({success: false, error: true, reason: err});
            PluginManager.updatePluginInfo(plugin_path);
            response('success', 'The plugin was successfully uploaded'); // res.redirect('/plugin');
        });
    });

    /**
     * @param {'success'|'err'} type 
     * @param {string} message 
     */
    function response(type, message) {
        res.redirect(`/plugin?${type}=${encodeURIComponent(message)}`);
    }
});

app.post('/update')

module.exports = app;