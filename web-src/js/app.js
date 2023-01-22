$('#ytchat').click(() => {
    console.log('toggling yt chat');
    var obj = JSON.stringify({
        "listener": "toggle-chat",
        "value": null
    })
    window.chrome.webview.postMessage(obj);
});

$('#search').click(() => {
    var url = $('#link-input').val();
    var obj = JSON.stringify({
        "listener": "change-url",
        "value": url
    })
    window.chrome.webview.postMessage(obj);
});

$('select').selectmenu()

