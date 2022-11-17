const jar_path = 'C:/Users/thor0/Desktop/UltimateSurvival/plugins/worldedit-bukkit-7.2.12.jar';

const decompress = require('decompress');
const YAML = require('js-yaml');

pl_get_name(jar_path).then(name => console.log(name));

function pl_get_name(path) {
    return new Promise((resolve, reject) => {
        decompress(path, { filter: file => /.*plugin.yml/.test(file.path), }).then(files => {
            resolve(YAML.load(files[0].data.toString('ascii')).name);
        }).catch(err => reject(err));
    });
}

