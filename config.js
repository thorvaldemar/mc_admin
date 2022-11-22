const fs = require('fs');

/**
 * @typedef {Object} RawConfig
 * @property {string} server_folder
 * @property {number} max_memory
 * @property {number} max_heap
 */

module.exports = class Config {
    constructor() {
        /** @type {string} */
        this.config_path = `${this.getAppFolder()}/config.json`;

        /** @type {boolean} */
        this._configExists = false;

        /** @type {RawConfig} */
        this.raw_config = null;

        this.getConfig('');
    }

    configExists() {
        this.getConfig('');
        return this._configExists;
    }

    /**
     * @param {'server_folder'|'max_memory'|'max_heap'} key 
     * @returns {string}
     */
    getConfig(key) {
        if (!this._configExists) {
            this._configExists = fs.existsSync(this.config_path);
            if (!this._configExists) return null;
            this.raw_config = JSON.parse(fs.readFileSync(this.config_path, 'ascii'));
        }
        return this.raw_config[key];
    }

    /**
     * @param {RawConfig} data 
     */
    save(data) {
        fs.writeFileSync(this.config_path, JSON.stringify(data));
    }

    /**
     * @returns {string}
     */
    getAppFolder() {
        const path = `${this.getDataFolder()}/mcadmin`;
        if (!fs.existsSync(path))
            fs.mkdir(path, () => {});
        return path;
    }

    /**
     * @returns {string}
     */
    getDataFolder() {
        return process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
    }
}