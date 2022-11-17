var socket = io();
socket.on('minecraft all', lines => {
    lines.forEach(line => {
        $('.console .screen').append(`<p>${line}</p>`);
    });
});

socket.on('minecraft newline', line => {
    $('.console .screen').append(`<p>${line}</p>`);
});