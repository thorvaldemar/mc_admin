const jar_path = 'C:/Users/thor0/Desktop/UltimateSurvival/plugins/worldedit-bukkit-7.2.12.jar';

const decompress = require('decompress');

pl_get_name(jar_path).then(name => console.log(name));

function pl_get_name(jar_path) {
    return new Promise((resolve, reject) => {
        decompress(jar_path, { filter: file => /.*plugin.yml/.test(file.path), }).then(files => {
            resolve([...files[0].data.toString('ascii').matchAll(/^name:[ ]*(.*)/gi)][0][1]);
        }).catch(err => reject(err));
    });
}

