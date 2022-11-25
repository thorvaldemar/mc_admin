const socket = io();

socket.on('plugins list', plugins => {
    $('.plugins').empty();
    if (plugins.length <= 0) $('.plugins').append(`<li id="comment">No plugins</li>`);
    plugins.forEach(plugin => addPlugin(plugin));
});

var pluginToUpload = null;

// socket.on('plugins new', plugin => {
//     addPlugin(plugin);
// });

$(() => {
    // document.querySelectorAll('.pluginUpload, .pluginUpload *').forEach(el => el.addEventListener('dragenter', e => $('.pluginUpload').addClass('dragging')));
    // document.querySelectorAll('.pluginUpload').forEach(el => el.addEventListener('dragleave', e => $('.pluginUpload').removeClass('dragging')));
    // document.querySelectorAll('.pluginUpload, .pluginUpload *').addEventListener('dragleave', e => $('.pluginUpload').removeClass('dragging'));

    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => {
        e.preventDefault();
        $('.pluginUpload').removeClass('dragging')
        if (e.dataTransfer.files <= 0) return;
        pluginToUpload = e.dataTransfer.files[0];
        $('.pluginUpload p').text(pluginToUpload.name).css('font-weight', 'normal');
    });

    

    $('.pluginUpload').on('submit', function(e) {
        e.preventDefault();

        if (!pluginToUpload) return;

        var fd = new FormData();
        // var files = $('#uploadPlugin #plugin')[0].files[0];
        fd.append('plugin', pluginToUpload);

        $.ajax({
            url: '/plugin/upload',
            type: 'post',
            data: fd,
            contentType: false,
            processData: false,
            success: data => {
                $('#uploadPlugin #plugin').val(null);
                pluginToUpload = null;
                $('.pluginUpload p').text('Drag plugin here').css('font-weight', 'bold');
                if (data.success) popup('The plugin was uploaded', 'success');
                else if (data.error) popup(data.reason, 'danger');
                else popup('An unknown error occoured', 'danger');
            },
        });
    });
});

function upload(e) {
    e.preventDefault();
    console.log(e);
}

function addPlugin(plugin) {
    if (!plugin) return popup('Trying to load an unloadable plugin');
    const el = $(`
        <li class="plugin ${plugin.disabled ? 'disabled' : ''}" pluginName="${plugin.name}" pluginVersion="${plugin.version}">
            <div class="options">
                <i class="bi bi-toggle-${plugin.disabled ? 'off' : 'on'}" id="switch" title="Enable/disable"></i>
                <i class="bi bi-pen" id="edit" title="Edit"></i>
                <i class="bi bi-trash3" id="delete" title="Delete"></i>
            </div>
            <p id="name">${plugin.name}</p>
            <p id="version">${plugin.version}</p>
        </li>
    `);
    el.find('.options #switch').on('click', function() {
        const plugin = $(this).parent().parent();
        $.post(`/plugin/toggle/${plugin.attr('pluginName')}/${plugin.attr('pluginVersion')}`, data => {
            if (data.success) popup(`The plugin has been ${data.disabled ? 'disabled' : 'enabled'}`, 'success');
            else if (data.error) popup(data.reason, 'danger');
            else popup('An unknown error occoured', 'danger');
        }, 'json');
    });
    el.find('.options #edit').on('click', () => popup('This action is not implemented yet', 'warning'));
    el.find('.options #delete').on('click', function() {
        const plugin = $(this).parent().parent();
        if (confirm(`Are you sure you want to delete the plugin ${plugin.attr('pluginName')}?`)) {
            $.post(`/plugin/remove/${plugin.attr('pluginName')}/${plugin.attr('pluginVersion')}`, data => {
                if (data.success) popup('The plugin has been deleted', 'success');
                else if (data.error) popup(data.reason, 'danger');
                else popup('An unknown error occoured', 'danger');
            }, 'json');
        }
    });
    $('.plugins').append(el);
}