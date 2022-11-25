var messages = 0;
var scrollAtBottom = true;
var connectedToService = true;
var socket = io();

socket.onAny(event => console.log(event));

socket.on('server backlog', lines => {
    $('.console .screen').empty();
    lines.forEach(line => {
        $('.console .screen').append(`<p>${line}</p>`);
    });
    scroll_bottom();
});

socket.on('server newline', line => {
    $('.console .screen').append(`<p>${line}</p>`);
    if (scrollAtBottom) scroll_bottom();
    else setMessageScroll(++messages);
});

socket.on('server status', status => {
    if (!connectedToService) return;
    if (status == 'start') serverStatus('The server is running', 'success');
    else if (status == 'stop') serverStatus('The server is closed', 'danger');
    else serverStatus(status, 'warning');
});

socket.on('service disconnect', () => {
    connectedToService = false;
    $('.service-control').show();
    serverStatus('No connection to the minecraft service', 'danger');
    popup('Disconnected from the minecraft service', 'danger');
    // if (confirm('The minecraft service is down. Will you try to start it?')) {
    //     socket.emit('service start', data => console.log(data));
    // }
});

socket.on('service connect', () => {
    if (!connectedToService) popup('Reconnected to the minecraft service!', 'success');
    $('.service-control').hide();
    serverStatus('Unknown', 'warning');
    connectedToService = true;
});

function scroll_bottom() {
    $('.console .screen')[0].scrollTop = $('.console .screen')[0].scrollHeight;
}

function setMessageScroll(messages) {
    $('.console #scroll-down p').toggle(messages > 0);
    $('.console #scroll-down p').text(messages > 99 ? '+99' : messages);
}

/**
 * @param {string} msg 
 * @param {'success'|'danger'|'warning'} level 
 */
function serverStatus(msg, level) {
    $('.status .visual').attr('status', level);
    $('.status #status').text(msg);
}

$(() => {
    if (!connectedToService) {
        $('.service-control').show();
        popup('Disconnected from the minecraft service', 'danger');
    }

    $('.service-control #kickstart').on('click', () => socket.emit('service start', data => {
        if (data.success) popup('Trying to kickstart the service', 'success');
        else if (data.error) popup(data.reason, 'danger');
        else popup('Something went wrong', 'danger');
    }));

    $('.service-control #ignore').on('click', () => $('.service-control').hide());

    $('.console .screen').on('scroll', function() {
        scrollAtBottom = this.scrollTop + this.offsetHeight == this.scrollHeight;
        $('.console #scroll-down').toggle(!scrollAtBottom);
        if (scrollAtBottom) messages = 0;
        setMessageScroll(messages);
    });

    $('.console .input').on('submit', e => {
        e.preventDefault();
        if (!connectedToService) return popup('The service is offline', 'danger');
        socket.emit('server write', $('.input input').val(), data => {
            if (!data.success && data.error) popup(data.reason, 'danger');
        });
        $('.input input').val('');
    });

    $('.console #scroll-down').on('click', () => scroll_bottom());

    $('#start').on('click', () => {
        if (!connectedToService) return popup('The service is offline', 'danger');
        socket.emit('server start', data => {
            if (data.success) {
                serverStatus('Starting the server', 'warning');
                popup('Starting the server', 'success');
            } else if (data.error) popup(data.reason, 'danger');
            else popup('Something went wrong', 'danger');
        });
    });
    $('#stop').on('click', () => {
        if (!connectedToService) return popup('The service is offline', 'danger');
        socket.emit('server stop', 0, '', data => {
            if (data.success) {
                serverStatus('Stopping the server', 'warning');
                popup('Stopping the server', 'success');
            } else if (data.error) popup(data.reason, 'danger');
            else popup('Something went wrong', 'danger');
        });
    });
});