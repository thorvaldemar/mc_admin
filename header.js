document.writeln(`
<script src="https://code.jquery.com/jquery-3.6.1.min.js" integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css">
<script src="/socket.io/socket.io.js"></script>
<link rel="stylesheet" href="/main.css">
`);


window.onload = (event) => {
    $.post('/topmenu', html => $('body').prepend($(html)));
    $('body').append(`<div class="popup-list"></div>`);
};

/**
 * @param {string} msg 
 * @param {'success'|'danger'|'warning'} type 
 */
function popup(msg, type = 'danger') {
    const al = $(`
        <div class="popup alert alert-${type}" role="alert">
            <strong>${type.toUpperCase()}!</strong> ${msg}
            <i class="close bi bi-x"></i>
        </div>
    `);
    $('.popup-list').prepend(al);
    setTimeout(() => al.fadeOut(500, function() { $(this).remove(); }), 5000);
    al.find('.close').on('click', function() { $(this).parent().remove(); });
}