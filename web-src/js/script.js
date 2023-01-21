//console.log('HELLO');
function loadScript(scriptUrl) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    document.body.appendChild(script);

    return new Promise((res, rej) => {
        script.onload = function () {
            res();
        }
        script.onerror = function () {
            rej();
        }
    });
}

function raiseMessageEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
    var message = eventData.message.innerHTML;

    var url = window.location.href;
    var url_array = url.split('=');
    var roomId = url_array[url_array.length - 1];

    var badges = "", badgeArray = [];
    var isMod, isMember;
    var userId, msgId;

    if (mutation.addedNodes[j].attributes["author-type"].value === "owner") {
        badges = "broadcaster/1"
    }

    userId = mutation.addedNodes[j].hostElement.__data.data.authorExternalChannelId
    msgId = mutation.addedNodes[j].__data.id

    for (var i = 0; i < eventData.content.childNodes[1].$["chat-badges"].childNodes.length; i++) {
        badgeArray.push({
            "type": eventData.content.childNodes[1].$["chat-badges"].childNodes[0].__data.type,
            "version": "1",
            "url": eventData.content.childNodes[1].$["chat-badges"].childNodes[0].$.image.childNodes[0].src
        })

        badges += (mutation.addedNodes[j].$.content.childNodes[1].$["chat-badges"].childNodes[0].__data.type + '/1')

        if (mutation.addedNodes[j].attributes["author-type"].value === "member") {
            isMember = "1"
        }
        if (mutation.addedNodes[j].attributes["author-type"].value === "moderator") {
            isMod = "1"
        }
    };

    var detail = {
        "listener": "message",
        "event": {
            "service": "youtube",
            "data": {
                "time": Date.now(),
                "tags": {
                    "badge-info": "",
                    "badges": badges,
                    "client-nonce": "",
                    "color": "#FFFFFF",
                    "display-name": authorName,
                    "emotes": "",
                    "first-msg": "0",
                    "flags": "",
                    "id": "",
                    "mod": isMod,
                    "returning-chatter": "0",
                    "room-id": roomId,
                    "subscriber": isMember,
                    "tmi-sent-ts": "",
                    "turbo": "",
                    "user-id": userId,
                    "user-type": ""
                },
                "nick": authorName,
                "userId": userId,
                "displayName": authorName,
                "displayColor": "#FFFFFF",
                "badges": badgeArray,
                "channel": "",
                "text": message,
                "isAction": false,
                "emotes": [],
                "msgId": msgId
            },
            "renderedText": message
        }
    }

    //window.boundEvent.raiseEvent('onEventReceived', obj);

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseMembershipEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
    var message = eventData.message.innerHTML;

    var detail = {
        "listener": "member-latest",
        "event": {
            "type": "member",
            "name": authorName,
            "amount": 1,
            "count": 1,
            "items": [],
            "tier": "1000",
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "member-latest"
        }
    }

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseMembershipGiftEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = mutation.addedNodes[j].$.header.$.content.childNodes[8].childNodes[1].childNodes[1].childNodes[2].$["author-name"].innerText;
    var message = mutation.addedNodes[j].$.header.$.content.childNodes[8].childNodes[1].childNodes[1].childNodes[6].innerHTML;

    var detail = {
        "listener": "gift-latest",
        "event": {
            "type": "gift",
            "name": authorName,
            "items": [],
            "tier": "1000",
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "gift-latest"
        }
    }

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseSuperchatEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = eventData["author-name-chip"].innerText;
    var message = eventData.message.innerHTML;

    var amount = mutation.addedNodes[j].$["purchase-amount"].innerText

    var tier, primary, secondary;
    if (mutation.addedNodes[j].attributes.style.value.includes("rgba(30,136,229,1)")) {
        tier = "1000";
        primary = "rgba(30,136,229,1)";
        secondary = "rgba(21,101,192,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(0,229,255,1)")) {
        tier = "2000";
        primary = "rgba(0,229,255,1)";
        secondary = "rgba(0,184,212,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(29,233,182,1)")) {
        tier = "3000";
        primary = "rgba(29,233,182,1)";
        secondary = "rgba(0,191,165,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(255,202,40,1)")) {
        tier = "4000";
        primary = "rgba(255,202,40,1)";
        secondary = "rgba(255,179,0,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(245,124,0,1)")) {
        tier = "5000";
        primary = "rgba(245,124,0,1)";
        secondary = "rgba(230,81,0,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(233,30,99,1)")) {
        tier = "6000";
        primary = "rgba(233,30,99,1)";
        secondary = "rgba(194,24,91,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(230,33,23,1)")) {
        tier = "7000";
        primary = "rgba(230,33,23,1)";
        secondary = "rgba(208,0,0,1)";
    }
    else {
        tier = "0000"
        primary = "rgba(255,255,255,1)";
        secondary = "rgba(0,0,0,1)";
    }

    var detail = {
        "listener": "superchat-latest",
        "event": {
            "type": "superchat",
            "name": authorName,
            "amount": amount,
            "count": 1,
            "items": [],
            "tier": tier,
            "colors": {
                "primaryColor": primary,
                "secondaryColor": secondary
                },
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "superchat-latest"
        }
    }

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseStickerEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = eventData["author-name-chip"].innerText;

    var amount = mutation.addedNodes[j].$["purchase-amount-chip"].innerText

    var tier, primary, secondary;
    if (mutation.addedNodes[j].attributes.style.value.includes("rgba(30,136,229,1)")) {
        tier = "1000";
        primary = "rgba(30,136,229,1)";
        secondary = "rgba(21,101,192,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(0,229,255,1)")) {
        tier = "2000";
        primary = "rgba(0,229,255,1)";
        secondary = "rgba(0,184,212,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(29,233,182,1)")) {
        tier = "3000";
        primary = "rgba(29,233,182,1)";
        secondary = "rgba(0,191,165,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(255,202,40,1)")) {
        tier = "4000";
        primary = "rgba(255,202,40,1)";
        secondary = "rgba(255,179,0,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(245,124,0,1)")) {
        tier = "5000";
        primary = "rgba(245,124,0,1)";
        secondary = "rgba(230,81,0,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(233,30,99,1)")) {
        tier = "6000";
        primary = "rgba(233,30,99,1)";
        secondary = "rgba(194,24,91,1)";
    }
    else if (mutation.addedNodes[j].attributes.style.value.includes("rgba(230,33,23,1)")) {
        tier = "7000";
        primary = "rgba(230,33,23,1)";
        secondary = "rgba(208,0,0,1)";
    }
    else {
        tier = "0000"
        primary = "rgba(255,255,255,1)";
        secondary = "rgba(0,0,0,1)";
    }

    var stickerUrl = mutation.addedNodes[j].$.sticker.$.img.currentSrc.toString();
    
    var detail = {
        "listener": "sticker-latest",
        "event": {
            "type": "sticker",
            "name": authorName,
            "amount": amount,
            "count": 1,
            "items": [],
            "colors": {
                "primaryColor": primary,
                "secondaryColor": secondary
            },
            "tier": tier,
            "month": "",
            "stickerUrl": stickerUrl,
            "message": "",
            "sessionTop": false,
            "originalEventName": "sticker-latest"
        }
    }

    console.log(detail.event.stickerUrl)

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

var signalRscript = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.js"

loadScript(signalRscript)
    .then(() => {
        startStream()
    })

function startStream() {

    const callback = (mutationList, observer) => {
        console.log(mutationList)
        for (const mutation of mutationList) {
            for (var j = 0; j < mutation.addedNodes.length; j++) {
                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
                    raiseMessageEvent(mutation, j, connection);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER") {
                    raiseMembershipEvent(mutation, j, connection);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-PAID-MESSAGE-RENDERER") {
                    raiseSuperchatEvent(mutation, j, connection);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-PAID-STICKER-RENDERER") {
                    setTimeout(() => raiseStickerEvent(mutation, j, connection), 100)
                }
            }

            for (j = 0; j < mutation.removedNodes.length; j++) {
                var removed_id = mutation.removedNodes[j].__data.id
                var detail = {
                    "listener": "delete-message",
                    "event": {
                        "service": "youtube",
                        "data": {
                            "time": Date.now(),
                            "msgId": removed_id
                        }
                    }
                }
                connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
                    return console.error(err.toString());
                });
            }
        }
    };

    const observer = new MutationObserver(callback);

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:6970/stream")
        .configureLogging(signalR.LogLevel.Information)
        .withAutomaticReconnect()
        .build();

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
        } catch (err) {
            console.log(err);
            setTimeout(start, 5000);
        }
    };

    connection.onclose(async () => {
        await start();
    });

    start().then(() => {
        observer.observe(document.querySelector("yt-live-chat-item-list-renderer #items"), { subtree: false, childList: true });
    }) 

}