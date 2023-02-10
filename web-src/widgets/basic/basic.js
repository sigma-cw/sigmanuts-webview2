
window.addEventListener('onEventReceived', function (obj) {
    //console.log(obj.detail);

    if (obj.detail.listener == "url-change") {
        clearMessages();
        return;
    }

    if (obj.detail.listener == "delete-message") {
        let msgId = obj.detail.event.data.msgId;
        removeMessage(msgId);
        return;
    }

    if (obj.detail.listener !== "youtube-basic") return;

    let htmlText = obj.detail.event.html;
    addElement(htmlText);
});

function clearMessages() {
    $('yt-live-chat-item-list-renderer div#items').empty();
}

function removeMessage(msgId) {
    //Some messages have %3D at the end of the id, breaking the code
    msgId = msgId.replaceAll(`%3D`, "");
    let elem = $(`#${msgId}`);
    if (elem) {
        elem.remove();
    }
}

function addElement(htmlText) {
    element = $.parseHTML(htmlText);

    //Some messages have %3D at the end of the id, breaking the code
    let id = $(element).attr("id");
    id = id.replaceAll(`%3D`, "");
    $(element).attr("id", id);

    $(element).appendTo('yt-live-chat-item-list-renderer div#items');
}