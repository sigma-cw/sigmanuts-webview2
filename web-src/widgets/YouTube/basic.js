$(document).ready(function () {

    window.addEventListener('onEventReceived', function (obj) {
        //console.log(obj.detail);

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
        addElement(htmlText);
    });

    window.addEventListener('onWidgetLoad', function (obj) {

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

    function addElement(htmlText) {
        if (!htmlText) return;
        element = $.parseHTML(htmlText);

        //Some messages have %3D at the end of the id, breaking the code
        //mem
        let id = $(element).attr("id");
        id = id.replaceAll(`%3D`, "");
        $(element).attr("id", id);

        $(element).appendTo('#items');
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
});