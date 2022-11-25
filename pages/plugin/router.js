const fs = require('fs');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const PluginManager = require('../../pluginManager');
const PageRoute = require('../../PageRoute');

module.exports = class PluginPage extends PageRoute {
    init() {
        this.app.get('/', async (req, res) => {
            // const dom = new JSDOM(fs.readFileSync(`${__dirname}/index.html`, 'ascii'));
            // const $ = jquery(dom.window);
        
            // const plugins = await PluginManager.getList(`${this.config.getConfig('server_folder')}/plugins`);
            // plugins.forEach(pl => $('.plugins').append(`
            //     <li class="plugin">
            //         <div class="options">
            //             <i class="bi bi-toggle-on" id="switch" title="Enable/disable"></i>
            //             <i class="bi bi-pen" id="edit" title="Edit"></i>
            //             <i class="bi bi-trash3" id="delete" title="Delete"></i>
            //         </div>
            //         <p id="name">${pl.name}</p>
            //         <p id="version">${pl.version}</p>
            //     </li>
            // `));
            
            // // if (req.query.success) $('body').append(`<script>popup('${req.query.success}', 'success');</script>`);
            // // if (req.query.err) $('body').append(`<script>popup('${req.query.err}', 'danger');</script>`);

            // // if (req.query.success) $('#upload-status').append(`<p style="color: green">${req.query.success}</p>`);
            // // if (req.query.err) $('#upload-status').append(`<p style="color: red">${req.query.err}</p>`);
        
            // res.send(dom.serialize());
            res.sendFile(`${__dirname}/index.html`);
        });
        this.app.get('/style.css', (req, res) => res.sendFile(`${__dirname}/style.css`));
        this.app.get('/app.js', (req, res) => res.sendFile(`${__dirname}/app.js`));
        
        this.app.post('/upload', (req, res) => {
            const plugin_path = `${this.config.getConfig('server_folder')}/plugins/${req.files.plugin.name}`;
            if (!req.files || !req.files.plugin) return res.send({success: false, error: true, reason: "No plugin file was attached"});
            if (req.files.plugin.name.split('.').pop() != 'jar') return res.send({success: false, error: true, reason: "File is not a .jar type"});
            if (fs.existsSync(plugin_path)) return res.send({success: false, error: true, reason: "The plugin file already exists"});
            PluginManager.getRawPluginInfo(req.files.plugin.data).then(pl_info => {
                const pl_list = PluginManager.getPluginList();
                for (const e of Object.keys(pl_list))
                    if (pl_list[e].name == pl_info.name) return res.send({success: false, error: true, reason: "A plugin with the same name already exists"});
        
                req.files.plugin.mv(plugin_path, (err) => {
                    if (err) return res.send({success: false, error: true, reason: err});
                    PluginManager.updatePluginInfo(plugin_path);
                    res.send({success: true, error: false, reason: null});
                    this.broadcastPlugins();
                });
            });
        });
        
        this.app.post('/remove/:pluginName/:pluginVersion', (req, res) => {
            res.send(PluginManager.removePlugin(`${this.config.getConfig('server_folder')}/plugins`, req.params.pluginName, req.params.pluginVersion));
            this.broadcastPlugins();
        });

        this.app.post('/toggle/:pluginName/:pluginVersion', (req, res) => {
            res.send(PluginManager.togglePlugin(`${this.config.getConfig('server_folder')}/plugins`, req.params.pluginName, req.params.pluginVersion));
            this.broadcastPlugins();
        });

        this.io.on('connection', async socket => {
            const plugins = await PluginManager.getList(`${this.config.getConfig('server_folder')}/plugins`);

            socket.emit('plugins list', plugins);
        });
    }

    async broadcastPlugins() {
        const plugins = await PluginManager.getList(`${this.config.getConfig('server_folder')}/plugins`);
        this.io.emit('plugins list', plugins);
    }
}