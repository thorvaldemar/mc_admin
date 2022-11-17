const fs = require('fs');

/**
 * @typedef {Object} RawConfig
 * @property {string} server_folder
 */

module.exports = class Config {
    constructor(config_path) {
        /** @type {string} */
        this.config_path = config_path;

        if (!fs.existsSync(this.config_path))
            throw Error(`Couldn't file config file at: '${this.config_path}'`);

        /** @type {RawConfig} */
        this.raw_config = JSON.parse(fs.readFileSync(this.config_path, 'ascii'));

        /** @type {string} */
        this.server_folder = this.raw_config.server_folder.replace(/%dirname%/g, __dirname);
    }
}