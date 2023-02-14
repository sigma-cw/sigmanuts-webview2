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
    console.log(eventData);
    var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;

    //add profile picture
    var authorPicture = eventData["author-photo"].$["img"].src;
    authorPicture = updateProfileImageSize(authorPicture);

    var message = eventData.message.innerHTML;
    message = updateEmoteSize(message);

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
        let url = updateBadgeSize(eventData.content.childNodes[1].$["chat-badges"].childNodes[0].$.image.childNodes[0].src);
        badgeArray.push({
            "type": eventData.content.childNodes[1].$["chat-badges"].childNodes[0].__data.type,
            "version": "1",
            "url": url
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
                "profileImage": authorPicture,
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
    //console.log(eventData);
    //var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
    var authorName = eventData["header-content-inner-column"].children[0].children["author-name"].innerText;

    var memberBadge = "";
    let badgeHolder = eventData["header-content-inner-column"].children[0].children["chat-badges"];
    if (badgeHolder.children.length >= 1) {
        memberBadge = badgeHolder.children[0].children["image"].children[0].src;
    }

    let primaryText = eventData["header-primary-text"].innerText;
    //parse months
    var months = "";
    let words = primaryText.split(" ");
    for (let i = 0; i < words.length && months === ""; i++) {
        if (!isNaN(words[i])) {
            months = words[i];
        }
    }
    if (months == "") months = 1;

    var authorPicture = eventData["header"].children["author-photo"].children["img"].src;

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
            "month": months,
            "message": message,
            "sessionTop": false,
            "originalEventName": "member-latest",
            "profileImage": authorPicture,
            "badges": memberBadge
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
    //add member badge url
    var memberBadge = "";
    //add author picture url
    var authorPicture = "";
    
    var amount = 1;
    /*
    let words = .split(" ");
    for (let i = 0; i < words.length && amount === 1; i++) {
        if (!isNaN(words[i])) {
            amount = words[i];
        }
    }*/

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
            "originalEventName": "gift-latest",
            "profileImage": authorPicture,
            "amount": amount
        }
    }

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseMembershipRedemptionEvent(mutation, j, connection) {
    var eventData = mutation.addedNodes[j]['$']
    //console.log(eventData)
    var authorName = ""; //mutation.addedNodes[j].$.header.$.content.childNodes[8].childNodes[1].childNodes[1].childNodes[2].$["author-name"].innerText;
    //add member badge url
    var memberBadge = "";
    //add author picture url
    var authorPicture = "";


    var message = ""; //mutation.addedNodes[j].$.header.$.content.childNodes[8].childNodes[1].childNodes[1].childNodes[6].innerHTML;

    var detail = {
        "listener": "gift-redemption",
        "event": {
            "type": "gift",
            "name": authorName,
            "items": [],
            "tier": "1000",
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "gift-redemption",
            "profileImage": authorPicture
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
    //add member badge url
    var memberBadge = "";
    let badgeHolder = eventData["author-name-chip"].children[0].children["chat-badges"];
    if (badgeHolder.children.length >= 1) {
        memberBadge = badgeHolder.children[0].children["image"].children[0].src;
    }
    //add author picture url
    var authorPicture = "";

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
            "originalEventName": "superchat-latest",
            "profileImage": authorPicture,
            "badges": memberBadge
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
    //add member badge url
    var memberBadge = "";
    //add author picture url
    var authorPicture = "";

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
            "originalEventName": "sticker-latest",
            "profileImage": authorPicture
        }
    }

    console.log(detail.event.stickerUrl)

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

function raiseBasicEvent(mutation, j, connection, event) {
    let rawHtml = mutation.addedNodes[j].outerHTML;
    var detail = {
        "listener": "youtube-basic",
        "event": {
            "type": event,
            "html": rawHtml
        }
    }

    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}

//this event is raised when the app launches/changes url
function raiseUrlChangeEvent(connection, url) {
    var detail = {
        "listener": "url-change",
        "event": {
            "type": "url-change",
            "url": url
        }
    }

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

                //should the raw html included in every events?
                //right now it is in it's separate function to pass as is

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
                    raiseMessageEvent(mutation, j, connection);
                    raiseBasicEvent(mutation, j, connection, "message");
                    //console.log(`MESSAGE!`);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER") {
                    raiseMembershipEvent(mutation, j, connection);
                    raiseBasicEvent(mutation, j, connection, "member-latest");
                    //console.log(`MEMBER!`);
                }

                if (mutation.addedNodes[j].nodeName === "YTD-SPONSORSHIPS-LIVE-CHAT-GIFT-PURCHASE-ANNOUNCEMENT-RENDERER") {
                    raiseMembershipGiftEvent(mutation, j, connection);
                    raiseBasicEvent(mutation, j, connection, "gift-latest");
                    //console.log(`GIFT!`);
                }

                if (mutation.addedNodes[j].nodeName === "YTD-SPONSORSHIPS-LIVE-CHAT-GIFT-REDEMPTION-ANNOUNCEMENT-RENDERER") {
                    raiseMembershipRedemptionEvent(mutation, j, connection);
                    raiseBasicEvent(mutation, j, connection, "member-gifted");
                    //console.log(`GIFT RECEIVE!`);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-PAID-MESSAGE-RENDERER") {
                    raiseSuperchatEvent(mutation, j, connection);
                    raiseBasicEvent(mutation, j, connection, "superchat-latest");
                    //console.log(`SUPER!`);
                }

                if (mutation.addedNodes[j].nodeName === "YT-LIVE-CHAT-PAID-STICKER-RENDERER") {
                    setTimeout(() => raiseStickerEvent(mutation, j, connection), 100);
                    setTimeout(() => raiseBasicEvent(mutation, j, connection, "sticker-latest"), 100);
                    //console.log(`STICKER!`);                   
                }


                //add member gift received event?
                //username received membership
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
        raiseUrlChangeEvent(connection, window.location.href);
        observer.observe(document.querySelector("yt-live-chat-item-list-renderer #items"), { subtree: false, childList: true });
    }) 



}

//replaces emote image link with a higher resolution
function updateEmoteSize(message, newSize = 32) {
    let newMessage = message.replaceAll(`=w24-h24-c-k-nd"`, `=w${newSize}-h${newSize}-c-k-nd"`);
    return newMessage;
}

//replaces badge image link with a higher resolution
function updateBadgeSize(badgeUrl, newSize = 64) {
    let newBadgeUrl = badgeUrl.replaceAll(`=s16-c-k`, `=s${newSize}-c-k`);
    return newBadgeUrl;
}

//replaces profile image link with a higher resolution
function updateProfileImageSize(imgUrl, newSize = 64) {
    let newPictureUrl = imgUrl.replaceAll(`=s32-c-k-c0x00ffffff-no-rj`, `=s${newSize}-c-k-c0x00ffffff-no-rj`);
    return newPictureUrl;
}