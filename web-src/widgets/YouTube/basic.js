$(document).ready(function () {

    window.addEventListener('onEventReceived', function (obj) {

        if (obj.detail.listener == "url-change") {
            clearMessages();
            return;
        }

        if (obj.detail.listener == "reconnect") {
            console.log("Chat reconnected");
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
        let animate = true;
        if (obj.detail.event.type == "member-gifted") animate = false;
        addElement(htmlText, animate);
    });

    window.addEventListener('onWidgetLoad', function (obj) {
        console.log("ONWIDGETLOAD");
        if (!obj.detail) return;
        console.log(obj.detail.fieldData);
        let fields = obj.detail.fieldData;

        if (fields.colorMode == "dark") {
            $("html").attr("dark", '');
            $("html").removeAttr("light");
        }
        else {
            $("html").attr("light", '');
            $("html").removeAttr("dark");
        }

        if (fields.transparentBg) {
            $("html").attr("transparent", '');
        }
        else {
           $("html").removeAttr("transparent");
        }
    });

});



function clearMessages() {
    $('yt-live-chat-item-list-renderer div#items').empty();
}

function removeMessage(msgId) {
    if (!msgId) return;

    //Some messages have %3D at the end of the id, breaking the code
    msgId = msgId.replaceAll(`%3D`, "");
    let elem = $(`#${msgId}`);
    if (elem) {
        elem.remove();
    }
}

function addElement(htmlText, animate) {
    if (!htmlText) return;
    element = $.parseHTML(htmlText);

    //Some messages have %3D at the end of the id, breaking the code
    //mem
    let id = $(element).attr("id");
    id = id.replaceAll(`%3D`, "");
    $(element).attr("id", id);

    $(element).appendTo('#items');

    if (animate) {
        let height = $(element).outerHeight();

        $('#items').finish().css("transform", `translateY(${height}px)`).animate(
            {
                distance: height
            },
            {
                step: function (now, fx) {
                    if (fx.prop === "distance") {
                        $(this).css("transform", `translateY(${height - now}px)`);
                    }
                },
                complete: function () {
                    this.distance = 0;
                },
                duration: 80
            });
    }
}