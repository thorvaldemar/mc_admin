var messages = 0;
var scrollAtBottom = false;
var socket = io();

socket.on('minecraft all', lines => {
    $('.console .screen').empty();
    lines.forEach(line => {
        $('.console .screen').append(`<p>${line}</p>`);
    });
    scroll_bottom();
});

socket.on('minecraft newline', line => {
    $('.console .screen').append(`<p>${line}</p>`);
    if (scrollAtBottom) scroll_bottom();
    else setMessageScroll(++messages);
});

socket.on('minecraft status', status => {
    $('#status').text(status);
});

function scroll_bottom() {
    $('.console .screen')[0].scrollTop = $('.console .screen')[0].scrollHeight;
}

function setMessageScroll(messages) {
    $('.console #scroll-down p').toggle(messages > 0);
    $('.console #scroll-down p').text(messages > 99 ? '+99' : messages);
}

$(() => {
    $('.console .screen').on('scroll', function() {
        scrollAtBottom = this.scrollTop + this.offsetHeight == this.scrollHeight;
        $('.console #scroll-down').toggle(!scrollAtBottom);
        if (scrollAtBottom) messages = 0;
        setMessageScroll(messages);
    });

    $('.console .input').on('submit', e => {
        e.preventDefault();
        socket.emit('minecraft write', $('.input input').val());
        $('.input input').val('');
    });

    $('.console #scroll-down').on('click', () => scroll_bottom());

    $('#start').on('click', () => socket.emit('minecraft start'));
    $('#stop').on('click', () => socket.emit('minecraft stop'));
});