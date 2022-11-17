var socket = io();
socket.on('minecraft all', lines => {
    $('.console .screen').empty();
    lines.forEach(line => {
        $('.console .screen').append(`<p>${line}</p>`);
    });
});

socket.on('minecraft newline', line => {
    $('.console .screen').append(`<p>${line}</p>`);
});

$(() => {
    $('.console .input').on('submit', e => {
        e.preventDefault();
        socket.emit('minecraft write', $('.input input').val());
        $('.input input').val('');
    })
});