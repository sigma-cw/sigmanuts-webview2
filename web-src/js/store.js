var layout = 'tiles';

$('#layout-tiles').click(() => {
    $(`#layout-${layout}`).removeClass('sidebar-button-active');

    $('#layout-tiles').addClass('sidebar-button-active');
    layout = 'tiles';
});

$('#layout-list').click(() => {
    $(`#layout-${layout}`).removeClass('sidebar-button-active');

    $('#layout-list').addClass('sidebar-button-active');
    layout = 'list';
});

window.addEventListener('DOMContentLoaded', () => {
    $('#layout-tiles').addClass('sidebar-button-active');
    layout = 'tiles';
});