const fs = require('fs');
const PATH = require('path');
const decompress = require('decompress');
const YAML = require('js-yaml');
const config = new (require('./config'))();
const plugins_file = `${config.getAppFolder()}/plugins.json`;

/**
 * @typedef {Object} Plugin
 * @property {string} name
 * @property {string} version
 */

module.exports = class PluginManager {

    /**
     * @param {string} path 
     * @returns {Promise<Array<Plugin>>} List of plugin names
     */
    static getList(path) {
        return new Promise(async (resolve, reject) => {
            var arr = [];
            
            for (const pl of fs.readdirSync(path)) {
                if (pl.split('.').pop().toLowerCase() !== 'jar') continue;
                const plugin = await this.getInfo(`${path}/${pl}`);
                arr.push(plugin);
            }
    
            resolve(arr);
        });
    }
    
    /**
     * @param {string} path 
     * @returns {Promise<Plugin>}
     */
    static getInfo(path) {
        return new Promise(async (resolve, reject) => {
            const saved_info = this._getSavedPluginInfo(PATH.basename(path));
            if (saved_info) return resolve(saved_info);
            const pl_info = await this.updatePluginInfo(path);
            resolve(pl_info);
        });
    }

    /**
     * @param {string} path 
     * @returns {Promise<Plugin>}
     */
    static updatePluginInfo(path) {
        return new Promise(async (resolve, reject) => {
            const plugin = await this.getRawPluginInfo(path);
            this._setSavedPluginInfo(PATH.basename(path), plugin);
            resolve(plugin);
        });
    }

    /**
     * @param {string|Buffer} file 
     * @returns {Promise<Plugin>}
     */
    static getRawPluginInfo(file) {
        return new Promise((resolve, reject) => {
            decompress(file, { filter: file => /.*plugin.yml/.test(file.path), }).then(files => {
                if (files.length <= 0) resolve({ name: PATH.basename(file), version: "UNKNOWN PLUGIN YAML", });
                const clean_yaml = files[0].data.toString('ascii').replace(/^o;\?/g, '');
                const yaml = YAML.load(clean_yaml);
                const plugin = {
                    name: yaml.name || "Unknown",
                    version: yaml.version || "-",
                };
                resolve(plugin);
            }).catch(err => reject(err));
        });
    }

    /**
     * @returns {Object<string, Plugin>}
     */
     static getPluginList() {
        return fs.existsSync(plugins_file) ? JSON.parse(fs.readFileSync(plugins_file, 'ascii')) : {};
    }

    /**
     * @param {string} file 
     * @returns {Plugin|null}
     */
    static _getSavedPluginInfo(file) {
        return this.getPluginList()[file] || null;
    }

    /**
     * @param {string} file 
     * @param {Plugin} info 
     */
    static _setSavedPluginInfo(file, info) {
        var data = this.getPluginList();
        data[file] = info;
        fs.writeFileSync(plugins_file, JSON.stringify(data));
    }

    
}