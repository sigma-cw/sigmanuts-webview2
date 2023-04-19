//console.log('HELLO');

function loadScript(scriptUrl) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    document.body.appendChild(script);

    //disable scrolling and changing Top Chat
    if (document.getElementById("item-scroller")) {
        document.getElementById("item-scroller").style.overflowY = "hidden";
    }
    if (document.getElementById("trigger")) {
        document.getElementById("trigger").style.display = "none";
    }

    //Youtube removed this part
    if (document.getElementById("overflow")) {
        document.getElementById("overflow").style.display = "none";
    }

    return new Promise((res, rej) => {
        script.onload = function () {
            res();
        }
        script.onerror = function () {
            rej();
        }
    });
}

function sendPastChats(amount = 20) {
    let pastChats = document.querySelector("#items.yt-live-chat-item-list-renderer").children;
    if (!pastChats.length) return;

    for (let i = Math.max(pastChats.length - amount, 0); i < pastChats.length; i++) {
        processNode(pastChats[i]);
    }
}

function raiseMessageEvent(node) {
    var eventData = node['$']
    //console.log(eventData);
    var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;

    //add profile picture
    var authorPicture = eventData["author-photo"].$["img"].src;
    //authorPicture = updateProfileImageSize(authorPicture);

    var message = eventData.message.innerHTML;
    message = updateEmoteSize(message);

    var url = window.location.href;
    var url_array = url.split('=');
    var roomId = url_array[url_array.length - 1];

    var badges = "", badgeArray = [];
    var isMod, isMember;
    var userId, msgId;
    var userType = "";

    if (node.attributes["author-type"].value === "owner") {
        badges = "broadcaster/1";
        userType = "owner";
    }

    userId = "";
    try {
        userId = node.hostElement.__data.data.authorExternalChannelId;
    } catch (error) { }
    msgId = node.id

    for (var i = 0; i < eventData.content.childNodes[1].$["chat-badges"].childNodes.length; i++) {       
        let badgeType = node.$.content.childNodes[1].$["chat-badges"].childNodes[i].__data.type;

        if (badges != "") badges += ",";
        badges += (node.$.content.childNodes[1].$["chat-badges"].childNodes[i].__data.type + '/1');

        let url = "";        
        if (badgeType === "member") {
            isMember = "1"
            url = eventData.content.childNodes[1].$["chat-badges"].childNodes[i].children["image"].childNodes[0].src;
            if (userType == "") userType = "member";
        }
        if (badgeType === "moderator") {
            isMod = "1"
            userType = "moderator";
        }

        badgeArray.push({
            "type": badgeType,
            "version": "1",
            "url": url
        })
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
                    "member": isMember,
                    "tmi-sent-ts": "",
                    "turbo": "",
                    "user-id": userId,
                    "user-type": userType
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

    sendPayload(detail);
}

function raiseMembershipEvent(node) {
    var eventData = node['$']
    //console.log(eventData);
    //var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
    var authorName = eventData["header-content-inner-column"].children[0].children["author-name"].innerText;

    var memberBadge = "";
    let badgeHolder = eventData["header-content-inner-column"].children[0].children["chat-badges"];
    if (badgeHolder.children.length >= 1) {
        memberBadge = badgeHolder.children[0].children["image"].children[0].src;
    }

    let primaryText = eventData["header-primary-text"].innerText;
    let memberTier = eventData["header-subtext"].innerText;
    //Welcome to [Membership]! for 1st time join
    //Membership name after that
    //parse months
    var months = "";
    let words = primaryText.split(" ");
    for (let i = 0; i < words.length && months === ""; i++) {
        if (!isNaN(words[i])) {
            months = words[i];
        }
    }
    if (months == "") months = 0;

    var authorPicture = eventData["header"].children["author-photo"].children["img"].src;

    var message = eventData.message.innerHTML;
    let msgId = node.id;

    var detail = {
        "listener": "member-latest",
        "event": {
            "type": "member",
            "name": authorName,
            "amount": months,
            "count": months,
            "items": [],
            "tier": memberTier,
            "month": months,
            "message": message,
            "sessionTop": false,
            "originalEventName": "member-latest",
            "profileImage": authorPicture,
            "badge": memberBadge,
            "msgId": msgId
        }
    }

    sendPayload(detail);
}

function raiseMembershipGiftEvent(node) {
    var eventData = node['$']
    //console.log(eventData)
    var authorName = eventData["header"].children["header"].children["content"].children["header-content"].children["header-content-primary-column"].children["header-content-inner-column"].children[0].children["author-name"].innerText;
    //add member badge url
    var memberBadge = "";
    let badgeHolder = eventData["header"].children["header"].children["content"].children["header-content"].children["header-content-primary-column"].children["header-content-inner-column"].children[0].children["chat-badges"];
    if (badgeHolder.children.length >= 1) {
        memberBadge = badgeHolder.children[badgeHolder.children.length-1].children["image"].children[0].src;
    }

    //add author picture url
    var authorPicture = eventData["header"].children["header"].children["content"].children["author-photo"].children["img"].src;
    
    var message = eventData["header"].children["header"].children["content"].children["header-content"].children["header-content-primary-column"].children["header-content-inner-column"].children["primary-text"].innerText;

    var amount = 1;
    let words = message.split(" ");
    for (let i = 0; i < words.length && amount === 1; i++) {
        if (!isNaN(words[i])) {
            amount = words[i];
        }
    }
    if (!amount) amount = 1;

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
            "amount": amount,
            "badge": memberBadge
        }
    }

    sendPayload(detail);
}

function raiseMembershipRedemptionEvent(node) {
    var eventData = node['$']
    console.log(eventData)
    var authorName = eventData["content"].children[1].children["author-name"].innerText;
    //add author picture url
    var authorPicture = node.children["author-photo"].children["img"].src;


    var message = eventData["message"].innerText;
    var gifter = eventData["message"].children[1].innerText;

    var detail = {
        "listener": "gift-redemption",
        "event": {
            "type": "gift-redemption",
            "name": authorName,
            "items": [],
            "tier": "1000",
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "gift-redemption",
            "profileImage": authorPicture,
            "sender": gifter
        }
    }

    sendPayload(detail);
}


function raiseSuperchatEvent(node) {
    var eventData = node['$']
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
    var authorPicture = eventData["header"].children["author-photo"].children["img"].src;
    var amount = node.$["purchase-amount"].innerText;

    var tier, primary, secondary;
    if (node.attributes.style.value.includes("rgba(30,136,229,1)")) {
        tier = "1000";
        primary = "rgba(30,136,229,1)";
        secondary = "rgba(21,101,192,1)";
    }
    else if (node.attributes.style.value.includes("rgba(0,229,255,1)")) {
        tier = "2000";
        primary = "rgba(0,229,255,1)";
        secondary = "rgba(0,184,212,1)";
    }
    else if (node.attributes.style.value.includes("rgba(29,233,182,1)")) {
        tier = "3000";
        primary = "rgba(29,233,182,1)";
        secondary = "rgba(0,191,165,1)";
    }
    else if (node.attributes.style.value.includes("rgba(255,202,40,1)")) {
        tier = "4000";
        primary = "rgba(255,202,40,1)";
        secondary = "rgba(255,179,0,1)";
    }
    else if (node.attributes.style.value.includes("rgba(245,124,0,1)")) {
        tier = "5000";
        primary = "rgba(245,124,0,1)";
        secondary = "rgba(230,81,0,1)";
    }
    else if (node.attributes.style.value.includes("rgba(233,30,99,1)")) {
        tier = "6000";
        primary = "rgba(233,30,99,1)";
        secondary = "rgba(194,24,91,1)";
    }
    else if (node.attributes.style.value.includes("rgba(230,33,23,1)")) {
        tier = "7000";
        primary = "rgba(230,33,23,1)";
        secondary = "rgba(208,0,0,1)";
    }
    else {
        tier = "0000"
        primary = "rgba(255,255,255,1)";
        secondary = "rgba(0,0,0,1)";
    }
    let msgId = node.id;

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
            "badges": memberBadge,
            "msgId": msgId
        }
    }

    sendPayload(detail);
}

function raiseStickerEvent(node) {
    var eventData = node['$']
    //console.log(eventData)
    var authorName = eventData["author-name-chip"].innerText;
    //add member badge url
    var memberBadge = "";
    //add author picture url
    var authorPicture = eventData["author-info"].children["author-photo"].children["img"].src;

    var amount = node.$["purchase-amount-chip"].innerText

    var tier, primary, secondary;
    if (node.attributes.style.value.includes("rgba(30,136,229,1)")) {
        tier = "1000";
        primary = "rgba(30,136,229,1)";
        secondary = "rgba(21,101,192,1)";
    }
    else if (node.attributes.style.value.includes("rgba(0,229,255,1)")) {
        tier = "2000";
        primary = "rgba(0,229,255,1)";
        secondary = "rgba(0,184,212,1)";
    }
    else if (node.attributes.style.value.includes("rgba(29,233,182,1)")) {
        tier = "3000";
        primary = "rgba(29,233,182,1)";
        secondary = "rgba(0,191,165,1)";
    }
    else if (node.attributes.style.value.includes("rgba(255,202,40,1)")) {
        tier = "4000";
        primary = "rgba(255,202,40,1)";
        secondary = "rgba(255,179,0,1)";
    }
    else if (node.attributes.style.value.includes("rgba(245,124,0,1)")) {
        tier = "5000";
        primary = "rgba(245,124,0,1)";
        secondary = "rgba(230,81,0,1)";
    }
    else if (node.attributes.style.value.includes("rgba(233,30,99,1)")) {
        tier = "6000";
        primary = "rgba(233,30,99,1)";
        secondary = "rgba(194,24,91,1)";
    }
    else if (node.attributes.style.value.includes("rgba(230,33,23,1)")) {
        tier = "7000";
        primary = "rgba(230,33,23,1)";
        secondary = "rgba(208,0,0,1)";
    }
    else {
        tier = "0000"
        primary = "rgba(255,255,255,1)";
        secondary = "rgba(0,0,0,1)";
    }

    var stickerUrl = node.$.sticker.$.img.currentSrc.toString();
    
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
            "profileImage": authorPicture,
        }
    }

    console.log(detail.event.stickerUrl)

    sendPayload(detail);
}

function raiseBasicEvent(node, event) {
    let rawHtml = node.outerHTML;
    var detail = {
        "listener": "youtube-basic",
        "event": {
            "type": event,
            "html": rawHtml
        }
    }

    sendPayload(detail);
}

//this event is raised when the app launches/changes url
function raiseUrlChangeEvent(url) {
    var detail = {
        "listener": "url-change",
        "event": {
            "type": "url-change",
            "url": url
        }
    }

    sendPayload(detail)
}

var connection;
var testConnection;
const messageDelay = 40;

var signalRscript = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.js"

loadScript(signalRscript)
    .then(() => {
        startStream()
    })

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDeletedNodes() {
    //If logged in, the deleted messages are not actually deleted but hidden
    let deletedNodes = document.querySelectorAll("[is-deleted]");
    if (deletedNodes.length) {
        console.log(deletedNodes);
        for (let i = 0; i < deletedNodes.length; i++) {
            deletedNodes[i].remove();
        }
    }
}

function startStream() {
    const callback = async (mutationList, observer) => {               
        console.log(mutationList);
        await sleep(messageDelay);
        for (let i = 0; i < mutationList.length; i++) {
            for (var j = 0; j < mutationList[i].addedNodes.length; j++) {
                processNode(mutationList[i].addedNodes[j]);
            }

            for (j = 0; j < mutationList[i].removedNodes.length; j++) {
                var removed_id = mutationList[i].removedNodes[j].__data.id
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
                sendPayload(detail);
            }
        }
    };

    const observer = new MutationObserver(callback);

    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:6970/stream")
        .configureLogging(signalR.LogLevel.Information)
        .withAutomaticReconnect()
        .build();

    testConnection = connection;


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
        raiseUrlChangeEvent(window.location.href);

        observer.observe(document.querySelector("yt-live-chat-item-list-renderer #items"), { subtree: false, childList: true });

        sendPastChats(20);

        let loggedIn = "";
        let authorNameDOM = document.querySelector("#input-container #author-name")
        if (authorNameDOM) {
            loggedIn = authorNameDOM.innerText;
        }

        if (loggedIn) {
            console.log("Logged in: " + loggedIn);
            checkDeletedNodes();
            setInterval(checkDeletedNodes, 1000);
        }
        else {
            console.log("Not logged in");
        }

    }) 

}

function processNode(node) {
    if (node.nodeName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
        raiseMessageEvent(node);
        raiseBasicEvent(node, "message");
    }

    if (node.nodeName === "YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER") {
        raiseMembershipEvent(node);
        raiseBasicEvent(node, "member-latest");
    }

    if (node.nodeName === "YTD-SPONSORSHIPS-LIVE-CHAT-GIFT-PURCHASE-ANNOUNCEMENT-RENDERER") {
        raiseMembershipGiftEvent(node);
        raiseBasicEvent(node, "gift-latest");
    }

    if (node.nodeName === "YTD-SPONSORSHIPS-LIVE-CHAT-GIFT-REDEMPTION-ANNOUNCEMENT-RENDERER") {
        raiseMembershipRedemptionEvent(node);
        raiseBasicEvent(node, "member-gifted");
    }

    if (node.nodeName === "YT-LIVE-CHAT-PAID-MESSAGE-RENDERER") {
        raiseSuperchatEvent(node);
        raiseBasicEvent(node, "superchat-latest");
    }

    if (node.nodeName === "YT-LIVE-CHAT-PAID-STICKER-RENDERER") {
        setTimeout(() => {
            raiseStickerEvent(node);
            raiseBasicEvent(node, "sticker-latest");
        }, 160);
    }
}

//replaces emote image link with a higher resolution
function updateEmoteSize(message, newSize = 32) {
    if (!message) return message;
    let newMessage = message.replaceAll(`=w24-h24-c-k-nd"`, `=w${newSize}-h${newSize}-c-k-nd"`);
    return newMessage;
}

//replaces badge image link with a higher resolution
function updateBadgeSize(badgeUrl, newSize = 64) {
    if (!badgeUrl) return badgeUrl;
    let newBadgeUrl = badgeUrl.replaceAll(`=s16-c-k`, `=s${newSize}-c-k`);
    return newBadgeUrl;
}

//replaces profile image link with a higher resolution
function updateProfileImageSize(imgUrl, newSize = 64) {
    if (!imgUrl) return imgUrl;
    let newPictureUrl = imgUrl.replaceAll(`=s32-c-k-c0x00ffffff-no-rj`, `=s${newSize}-c-k-c0x00ffffff-no-rj`);
    return newPictureUrl;
}

let testMessageCounter = 0;
function testMessage(type = "test-message") {
    testMessageCounter++;

    if (type == "test-message") {
        addTestMessage();
    }
    if (type.startsWith("test-superchat")) {
        let tier = "";
        if (type.length > "test-superchat".length) {
            tier = type.charAt(type.length - 1);
        }
        addTestSuperchat(tier);
    }
    if (type == "test-sticker") {
        addTestSticker();
    }
    if (type == "test-member") {
        addTestMember();
    }
    if (type.startsWith("test-gift")) {
        let amount = 1;
        if (type.length > "test-gift".length) {
            amount = type.replace("test-gift-", "");
        }
        addTestGift(amount);
    }

}

const testAuthorPhoto = "https://yt4.ggpht.com/t_92ydL4fZzQOuyeS9OlmF2_HC7luuxgeOjozur2eVBRcbRu10bpgMFEjzoZ0_lN9f0F6XuPVA=s32-c-k-c0x00ffffff-no-rj";
let currentTestMessage = 0;
/*
 * Author message
 * Mod message
 * Member message
 * Normal message
 * Long message
 * Verified user message
 */
const TEST_MEMBER_BADGE = {
    "type": "member",
    "version": "1",
    "url": "https://yt3.googleusercontent.com/zeHCFlNt83UNpIAFIEXYLoUDWNnFqSuHb1VqTlNJzGlVYxnjlNTegB56ofC_JcHutmYKaw3qmsU=s16-k-nd"
};
const TEST_MODERATOR_BADGE = {
    "type": "member",
    "version": "1",
    "url": "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/build/fill1/48px.svg"
};
const TEST_MESSAGE_DETAILS = [
    {
        name: "Broadcaster Name",
        message: `Hi! This is how channel owner chat will look like<img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://yt3.ggpht.com/WxLUGtJzyLd4dcGaWnmcQnw9lTu9BW3_pEuCp6kcM2pxF5p5J28PvcYIXWh6uCm78LxGJVGn9g=w24-h24-c-k-nd" alt="yougotthis" data-emoji-id="UCkszU2WH9gy1mb0dV-11UJg/hf90Xv-jHeOR8gSxxrToBA" shared-tooltip-text=":yougotthis:" id="emoji-14">`,
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "owner",
        badges: []
    },
    {
        name: "Moderator name",
        message: "This is a mod message",
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "moderator",
        badges: [TEST_MODERATOR_BADGE]
    },
    {
        name: "Some cool member with a long name",
        message: `AUUGHHHH<img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://yt3.ggpht.com/pWxhQ_AK8pmeiKURTW1jvc-qwPmU5wsxkDyxuGxHVKB4xHroF9NAMtnC1xljIWFF8zaIjbSE=w48-h48-c-k-nd"><img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://yt3.ggpht.com/pWxhQ_AK8pmeiKURTW1jvc-qwPmU5wsxkDyxuGxHVKB4xHroF9NAMtnC1xljIWFF8zaIjbSE=w48-h48-c-k-nd"><img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://yt3.ggpht.com/pWxhQ_AK8pmeiKURTW1jvc-qwPmU5wsxkDyxuGxHVKB4xHroF9NAMtnC1xljIWFF8zaIjbSE=w48-h48-c-k-nd">`,
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "member",
        badges: [TEST_MEMBER_BADGE]
    },
    {
        name: "Viewer A",
        message: "This is test message",
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "",
        badges:[]
    },
    {
        name: "Some other viewer but with a longer name for some reason",
        message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus consequat nibh sed dui imperdiet, ac semper neque faucibus. Pellentesque ut ipsum nibh. Nam sit amet eros justo. Donec maximus metus id leo efficitur, at volutpat ligula rutrum. Quisque dolor enim, interdum et pharetra non, condimentum mollis neque. Donec sit amet consequat justo.",
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "",
        badges: []
    },
    {
        name: "Verified Channel Name",
        message: "This is how verified user look like",
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "",
        badges: []
    },
    {
        name: "Member name",
        message: `<img class="emoji yt-formatted-string style-scope yt-live-chat-text-message-renderer" src="https://yt3.ggpht.com/pWxhQ_AK8pmeiKURTW1jvc-qwPmU5wsxkDyxuGxHVKB4xHroF9NAMtnC1xljIWFF8zaIjbSE=w48-h48-c-k-nd">`,
        authorPicture: testAuthorPhoto,
        authorExternalChannelId: "ChannelId",
        authorType: "member",
        badges: [TEST_MEMBER_BADGE]
    }
];

function addTestMessage() {
    currentTestMessage = currentTestMessage % TEST_MESSAGE_DETAILS.length;
    let testMessageDetail = TEST_MESSAGE_DETAILS[currentTestMessage];
    let verifiedBadge = ``;
    if (testMessageDetail.name.includes("Verified")) {
        verifiedBadge = `<yt-live-chat-author-badge-renderer class="style-scope yt-live-chat-author-chip" aria-label="Verified" type="verified" shared-tooltip-text="Verified"><div id="image" class="style-scope yt-live-chat-author-badge-renderer"><yt-icon class="style-scope yt-live-chat-author-badge-renderer"><svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g transform="scale(0.66)" class="style-scope yt-icon"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" class="style-scope yt-icon"></path></g></svg></yt-icon></div></yt-live-chat-author-badge-renderer>`;
    }
    let messageHTML =
        `<yt-live-chat-text-message-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}" ${(testMessageDetail.authorType == "owner") ?"author-is-owner":""} author-type="${testMessageDetail.authorType}">
    <!--css-build:shady-->
    <yt-img-shadow id="author-photo" class="no-transition style-scope yt-live-chat-text-message-renderer" height="24" width="24" style="background-color: transparent;" loaded="">
        <!--css-build:shady--><img id="img" draggable="false" class="style-scope yt-img-shadow" alt="" height="24" width="24" src="${testMessageDetail.authorPicture}"></yt-img-shadow>
    <div id="content" class="style-scope yt-live-chat-text-message-renderer"><span id="timestamp" class="style-scope yt-live-chat-text-message-renderer">00:00 PM</span>
        <yt-live-chat-author-chip class="style-scope yt-live-chat-text-message-renderer" ${((testMessageDetail.authorType == "owner") || (testMessageDetail.name.includes("Verified"))) ? "is-highlighted" : ""}>
            <!--css-build:shady--><span id="prepend-chat-badges" class="style-scope yt-live-chat-author-chip"></span><span id="author-name" dir="auto" class="${testMessageDetail.authorType} style-scope yt-live-chat-author-chip">${testMessageDetail.name}<span id="chip-badges" class="style-scope yt-live-chat-author-chip">${verifiedBadge}</span></span><span id="chat-badges" class="style-scope yt-live-chat-author-chip">
                <yt-live-chat-author-badge-renderer class="style-scope yt-live-chat-author-chip" type="${testMessageDetail.authorType}">
                    <!--css-build:shady-->
                    <div id="image" class="style-scope yt-live-chat-author-badge-renderer">${testMessageDetail.badges.length ? testMessageDetail.badges[0]:""}</div>
                </yt-live-chat-author-badge-renderer>
            </span></yt-live-chat-author-chip>​<span id="message" dir="auto" class="style-scope yt-live-chat-text-message-renderer">${testMessageDetail.message}</span><span id="deleted-state" class="style-scope yt-live-chat-text-message-renderer"></span><a id="show-original" href="#" class="style-scope yt-live-chat-text-message-renderer"></a>
    </div>
</yt-live-chat-text-message-renderer>`;
    let detail = {
        "listener": "message",
        "event": {
            "service": "youtube",
            "data": {
                "time": Date.now(),
                "tags": {
                    "badge-info": "",
                    "badges": (testMessageDetail.badges.length ? testMessageDetail.badges[0] :""),
                    "client-nonce": "",
                    "color": "#FFFFFF",
                    "display-name": testMessageDetail.name,
                    "emotes": "",
                    "first-msg": "0",
                    "flags": "",
                    "id": "",
                    "mod": testMessageDetail.authorType == "moderator",
                    "returning-chatter": "0",
                    "room-id": "",
                    "subscriber": testMessageDetail.authorType == "member",
                    "member": testMessageDetail.authorType == "member",
                    "tmi-sent-ts": "",
                    "turbo": "",
                    "user-id": "userId",
                    "user-type": testMessageDetail.authorType
                },
                "nick": testMessageDetail.name,
                "userId": "userId",
                "displayName": testMessageDetail.name,
                "displayColor": "#FFFFFF",
                "profileImage": testMessageDetail.authorPicture,
                "badges": testMessageDetail.badges,
                "channel": "",
                "text": testMessageDetail.message,
                "isAction": false,
                "emotes": [],
                "msgId": `test-message-${testMessageCounter}`
            },
            "renderedText": testMessageDetail.message
        }
    }

    sendBasicTest(messageHTML, "message");
    sendTestPayload(detail);
    currentTestMessage++;
}

let currentSuperTest = 0;
const TEST_SUPER_COLORS =
    [
        {
            "tier": 1000,
            "primary": "rgba(30,136,229,1)",
            "secondary": "rgba(21,101,192,1)",
            "textHeader": "rgba(255,255,255,1)",
            "textAuthor": "rgba(255,255,255,0.701961)",
            "textMessage": "rgba(255,255,255,1)",
            "amount": "$1.00"
        },
        {
            "tier": 2000,
            "primary": "rgba(0,229,255,1)",
            "secondary": "rgba(0,184,212,1)",
            "textHeader": "rgba(0,0,0,1)",
            "textAuthor": "rgba(0,0,0,0.701961)",
            "textMessage": "rgba(0,0,0,1)",
            "amount": "$2.00"
        },
        {
            "tier": 3000,
            "primary": "rgba(29,233,182,1)",
            "secondary": "rgba(0,191,165,1)",
            "textHeader": "rgba(0,0,0,1)",
            "textAuthor": "rgba(0,0,0,0.541176)",
            "textMessage": "rgba(0,0,0,1)",
            "amount": "$5.00"
        },
        {
            "tier": 4000,
            "primary": "rgba(255,202,40,1)",
            "secondary": "rgba(255,179,0,1)",
            "textHeader": "rgba(0,0,0,0.87451)",
            "textAuthor": "rgba(0,0,0,0.541176)",
            "textMessage": "rgba(0,0,0,0.87451)",
            "amount": "$10.00"
        },
        {
            "tier": 5000,
            "primary": "rgba(245,124,0,1)",
            "secondary": "rgba(230,81,0,1)",
            "textHeader": "rgba(255,255,255,0.87451)",
            "textAuthor": "rgba(255,255,255,0.701961)",
            "textMessage": "rgba(255,255,255,0.87451)",
            "amount": "$20.00"
        },
        {
            "tier": 6000,
            "primary": "rgba(233,30,99,1)",
            "secondary": "rgba(194,24,91,1)",
            "textHeader": "rgba(255,255,255,1)",
            "textAuthor": "rgba(255,255,255,0.701961)",
            "textMessage": "rgba(255, 255, 255, 1)",
            "amount": "$50.00"
        },
        {
            "tier": 7000,
            "primary": "rgba(230,33,23,1)",
            "secondary": "rgba(208,0,0,1)",
            "textHeader": "rgba(255,255,255,1)",
            "textAuthor": "rgba(255,255,255,0.701961)",
            "textMessage": "rgba(255, 255, 255, 1)",
            "amount": "$100.00"
        },
    ];

function addTestSuperchat(tier = "") {
    currentSuperTest = currentSuperTest % TEST_SUPER_COLORS.length;

    if (tier == "") tier = currentSuperTest++;
    else {
        tier = tier - 1;
    }
    let superDetail = TEST_SUPER_COLORS[tier];
    let message = "";
    if (superDetail.tier == 1000) { }
    else if (testMessageCounter % 3 == 1) {
        message = "This is a superchat message";
    }
    else if (testMessageCounter % 3 == 2) {
        message = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. <img class="small-emoji emoji yt-formatted-string style-scope yt-live-chat-paid-message-renderer" src="https://www.youtube.com/s/gaming/emoji/0f0cae22/emoji_u1fae1.svg" id="emoji-191"> Lorem Ipsum is simply dummy text of the printing and typesetting industry.`; 
    }

    let authorName = "Superchat Sender";

    let messageHTML = `<yt-live-chat-paid-message-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}" ${message == "" ? `show-only-header=""` : ""} allow-animations="" style="--yt-live-chat-paid-message-primary-color:${superDetail.primary}; --yt-live-chat-paid-message-secondary-color:${superDetail.secondary}; --yt-live-chat-paid-message-header-color:${superDetail.textHeader}; --yt-live-chat-disable-highlight-message-author-name-color:${superDetail.textAuthor}; --yt-live-chat-paid-message-timestamp-color:rgba(0,0,0,0.501961); --yt-live-chat-paid-message-color:${superDetail.textMessage};">
                    <!--css-build:shady-->
                    <div id="card" class="style-scope yt-live-chat-paid-message-renderer">
                        <div id="header" class="style-scope yt-live-chat-paid-message-renderer">

                            <yt-img-shadow id="author-photo" height="40" width="40" class="style-scope yt-live-chat-paid-message-renderer no-transition" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="40" width="40" src="${testAuthorPhoto}"></yt-img-shadow>
                            <dom-if restamp="" class="style-scope yt-live-chat-paid-message-renderer"><template is="dom-if"></template></dom-if>
                            <dom-if class="style-scope yt-live-chat-paid-message-renderer"><template is="dom-if"></template></dom-if>
                            <dom-if restamp="" class="style-scope yt-live-chat-paid-message-renderer"><template is="dom-if"></template></dom-if>
                            <div id="header-content" class="style-scope yt-live-chat-paid-message-renderer">
                                <div id="header-content-primary-column" class="style-scope yt-live-chat-paid-message-renderer">
                                    <div id="author-name-chip" class="style-scope yt-live-chat-paid-message-renderer"><yt-live-chat-author-chip disable-highlighting="" class="style-scope yt-live-chat-paid-message-renderer">
                                        <div id="author-name" class="style-scope yt-live-chat-paid-message-renderer">${authorName}</div>
                                    </yt-live-chat-author-badge-renderer></span></yt-live-chat-author-chip></div>
                                    <div id="purchase-amount-column" class="style-scope yt-live-chat-paid-message-renderer">
                                        <yt-img-shadow id="currency-img" height="16" width="16" class="style-scope yt-live-chat-paid-message-renderer no-transition" hidden="">
                                            <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="16" width="16"></yt-img-shadow>
                                        <div id="purchase-amount" class="style-scope yt-live-chat-paid-message-renderer">
                                            <yt-formatted-string class="style-scope yt-live-chat-paid-message-renderer">${superDetail.amount}</yt-formatted-string>
                                        </div>
                                    </div>
                                </div>
                                <span id="timestamp" class="style-scope yt-live-chat-paid-message-renderer">0:00</span>
                            </div>
                        </div>
                        <div id="content" class="style-scope yt-live-chat-paid-message-renderer">
                            <div id="message" dir="auto" class="style-scope yt-live-chat-paid-message-renderer">${message}</div>
                            <div id="input-container" class="style-scope yt-live-chat-paid-message-renderer">
                                <dom-if class="style-scope yt-live-chat-paid-message-renderer"><template is="dom-if"></template></dom-if>
                            </div>
                            <yt-formatted-string id="deleted-state" class="style-scope yt-live-chat-paid-message-renderer">
                                <!--css-build:shady-->
                            </yt-formatted-string>
                            <div id="footer" class="style-scope yt-live-chat-paid-message-renderer"></div>
                        </div>
                    </div>
                </yt-live-chat-paid-message-renderer>`;
    let detail = {
        "listener": "superchat-latest",
        "event": {
            "type": "superchat",
            "name": authorName,
            "amount": superDetail.amount,
            "count": 1,
            "items": [],
            "tier": superDetail.tier,
            "colors": {
                "primaryColor": superDetail.primary,
                "secondaryColor": superDetail.secondary
            },
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "superchat-latest",
            "profileImage": testAuthorPhoto,
            "badges": "",
            "msgId": `test-message-${testMessageCounter}`
        }
    };
    sendBasicTest(messageHTML, "superchat-latest");
    sendTestPayload(detail);
}

const STICKER_URL = "https://cdn.discordapp.com/attachments/507526507384537093/1075354703581421600/topiBOOBA.gif";

function addTestSticker() {
    currentSuperTest = currentSuperTest % TEST_SUPER_COLORS.length;
    let authorName = "Super Sticker Sender";
    let superDetail = TEST_SUPER_COLORS[currentSuperTest];
    let messageHTML = `<yt-live-chat-paid-sticker-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}" style="--yt-live-chat-paid-sticker-chip-background-color:${superDetail.primary}; --yt-live-chat-paid-sticker-chip-text-color:${superDetail.textHeader}; --yt-live-chat-paid-sticker-background-color:${superDetail.secondary}; --yt-live-chat-disable-highlight-message-author-name-color:${superDetail.textAuthor};">
                    <!--css-build:shady-->
                    <div id="card" class="style-scope yt-live-chat-paid-sticker-renderer">
                        <div id="author-info" tabindex="0" class="style-scope yt-live-chat-paid-sticker-renderer">
                            <yt-img-shadow id="author-photo" class="no-transition style-scope yt-live-chat-paid-sticker-renderer" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" width="40" height="40" src="${testAuthorPhoto}"></yt-img-shadow>
                            <dom-if restamp="" class="style-scope yt-live-chat-paid-sticker-renderer"><template is="dom-if"></template></dom-if>
                            <dom-if class="style-scope yt-live-chat-paid-sticker-renderer"><template is="dom-if"></template></dom-if>
                            <div id="content" class="style-scope yt-live-chat-paid-sticker-renderer"><span id="timestamp" class="style-scope yt-live-chat-paid-sticker-renderer">18:31</span>
                                <div id="content-primary-column" class="style-scope yt-live-chat-paid-sticker-renderer">
                                    <div id="author-name-chip" class="style-scope yt-live-chat-paid-sticker-renderer"><yt-live-chat-author-chip disable-highlighting="" single-line="" class="style-scope yt-live-chat-paid-sticker-renderer">
                                       <div id="author-name" class="style-scope yt-live-chat-paid-sticker-renderer">${authorName}</div>
                                    </yt-live-chat-author-chip></div>
                                    <span id="price-column" class="style-scope yt-live-chat-paid-sticker-renderer">
                                        <yt-formatted-string id="purchase-amount-chip" class="style-scope yt-live-chat-paid-sticker-renderer">${superDetail.amount}</yt-formatted-string>
                                        <yt-formatted-string id="deleted-state" class="style-scope yt-live-chat-paid-sticker-renderer">
                                            <!--css-build:shady-->
                                        </yt-formatted-string>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div id="sticker-container" class="style-scope yt-live-chat-paid-sticker-renderer sticker-loaded">
                            <yt-img-shadow id="sticker" notify-on-loaded="" tabindex="0" class="style-scope yt-live-chat-paid-sticker-renderer no-transition" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="POGCRAZY" width="72" height="72" src="${STICKER_URL}"></yt-img-shadow>
                        </div>
                    </div>
                </yt-live-chat-paid-sticker-renderer>`;
    let detail = {
        "listener": "sticker-latest",
        "event": {
            "type": "sticker",
            "name": authorName,
            "amount": superDetail.amount,
            "count": 1,
            "items": [],
            "colors": {
                "primaryColor": superDetail.primary,
                "secondaryColor": superDetail.secondary
            },
            "tier": superDetail.tier,
            "month": "",
            "stickerUrl": STICKER_URL,
            "message": "",
            "sessionTop": false,
            "originalEventName": "sticker-latest",
            "profileImage": testAuthorPhoto,
        }
    }
    sendBasicTest(messageHTML, "sticker-latest");
    sendTestPayload(detail);
    currentSuperTest++;
}

const TEST_BADGE = "https://yt3.ggpht.com/rpkYUyUfZAo1shsoHgQEftP4qwgdjbDKQK1HO2sY2Odgk1UcwNS1u5rCgbcbAoC7AD4qYnuX=s16-c-k";

function addTestMember() {
    let authorName = "New Member Name";
    let message = "";
    let month = 0;
    if (testMessageCounter % 2 == 0) {
        authorName = "Existing Member Name";
        month = 1 + Math.floor(Math.random() * 12);
        message = `I have subscribed for ${month} months!`;
    }
    let messageHTML = `<yt-live-chat-membership-item-renderer class="style-scope yt-live-chat-item-list-renderer" show-only-header="" id="test-message-${testMessageCounter}">
                    <!--css-build:shady-->
                    <div id="card" class="style-scope yt-live-chat-membership-item-renderer">
                        <div id="header" class="style-scope yt-live-chat-membership-item-renderer">

                            <yt-img-shadow id="author-photo" height="40" width="40" class="style-scope yt-live-chat-membership-item-renderer no-transition" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="40" width="40" src="${testAuthorPhoto}"></yt-img-shadow>
                            <dom-if restamp="" class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            <dom-if class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            <div id="header-content" class="style-scope yt-live-chat-membership-item-renderer">
                                <div id="header-content-primary-column" class="style-scope yt-live-chat-membership-item-renderer">
                                    <div id="header-content-inner-column" class="style-scope yt-live-chat-membership-item-renderer">

                                        <yt-live-chat-author-chip class="style-scope yt-live-chat-membership-item-renderer">
                                            <!--css-build:shady--><span id="author-name" dir="auto" class="member style-scope yt-live-chat-author-chip">${authorName}<span id="chip-badges" class="style-scope yt-live-chat-author-chip"></span></span><span id="chat-badges" class="style-scope yt-live-chat-author-chip">
                                                <yt-live-chat-author-badge-renderer class="style-scope yt-live-chat-author-chip" aria-label="New member" type="member" shared-tooltip-text="New member">
                                                    <!--css-build:shady-->
                                                    <div id="image" class="style-scope yt-live-chat-author-badge-renderer"><img src="${TEST_BADGE}" class="style-scope yt-live-chat-author-badge-renderer" alt="New member"></div>
                                                </yt-live-chat-author-badge-renderer>
                                            </span></yt-live-chat-author-chip>
                                        <dom-if restamp="" class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                                        <div id="header-primary-text" class="style-scope yt-live-chat-membership-item-renderer"></div>
                                    </div>
                                    <div id="header-subtext" class="style-scope yt-live-chat-membership-item-renderer">Welcome to Membership!</div>
                                </div>
                                <div id="timestamp" class="style-scope yt-live-chat-membership-item-renderer">11:44 AM</div>
                            </div>
                        </div>
                        <div id="content" class="style-scope yt-live-chat-membership-item-renderer">
                            <div id="message" dir="auto" class="style-scope yt-live-chat-membership-item-renderer"></div>
                            <div id="input-container" class="style-scope yt-live-chat-membership-item-renderer">
                                <dom-if class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            </div>
                            <yt-formatted-string id="deleted-state" class="style-scope yt-live-chat-membership-item-renderer">
                                <!--css-build:shady-->
                            </yt-formatted-string>
                        </div>
                    </div>
                </yt-live-chat-membership-item-renderer>`;
    if (month > 0) {
        messageHTML = `<yt-live-chat-membership-item-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}" has-inline-action-buttons="3" has-primary-header-text="">
                    <!--css-build:shady-->
                    <div id="card" class="style-scope yt-live-chat-membership-item-renderer">
                        <div id="header" class="style-scope yt-live-chat-membership-item-renderer">

                            <yt-img-shadow id="author-photo" height="40" width="40" class="style-scope yt-live-chat-membership-item-renderer no-transition" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="40" width="40" src="${testAuthorPhoto}"></yt-img-shadow>
                            <dom-if restamp="" class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            <dom-if class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            <div id="header-content" class="style-scope yt-live-chat-membership-item-renderer">
                                <div id="header-content-primary-column" class="style-scope yt-live-chat-membership-item-renderer">
                                    <div id="header-content-inner-column" class="style-scope yt-live-chat-membership-item-renderer">

                                        <yt-live-chat-author-chip class="style-scope yt-live-chat-membership-item-renderer">
                                            <!--css-build:shady--><span id="author-name" dir="auto" class="moderator style-scope yt-live-chat-author-chip">${authorName}<span id="chip-badges" class="style-scope yt-live-chat-author-chip"></span></span><span id="chat-badges" class="style-scope yt-live-chat-author-chip">
                                                <yt-live-chat-author-badge-renderer class="style-scope yt-live-chat-author-chip" aria-label="Member (${month} months)" type="member" shared-tooltip-text="Member (${month} months)">
                                                    <!--css-build:shady-->
                                                    <div id="image" class="style-scope yt-live-chat-author-badge-renderer"><img src="${TEST_BADGE}" class="style-scope yt-live-chat-author-badge-renderer" alt="Member (1 year)"></div>
                                                    <tp-yt-paper-tooltip class="style-scope yt-live-chat-author-badge-renderer" role="tooltip" tabindex="-1" style="--paper-tooltip-delay-in:0ms; inset: -49.6094px auto auto 91.5547px;">
                                                        <!--css-build:shady-->
                                                        <div id="tooltip" class="style-scope tp-yt-paper-tooltip hidden" style-target="tooltip">
                                                            Member (${month} months)
                                                        </div>
                                                    </tp-yt-paper-tooltip>
                                                </yt-live-chat-author-badge-renderer>
                                            </span></yt-live-chat-author-chip>
                                        <dom-if restamp="" class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                                        <div id="header-primary-text" class="style-scope yt-live-chat-membership-item-renderer">Member for ${month} months</div>
                                    </div>
                                    <div id="header-subtext" class="style-scope yt-live-chat-membership-item-renderer">Membership Tier</div>
                                </div>
                                <div id="timestamp" class="style-scope yt-live-chat-membership-item-renderer">0:00 PM</div>
                            </div>
                        </div>
                        <div id="content" class="style-scope yt-live-chat-membership-item-renderer">
                            <div id="message" dir="auto" class="style-scope yt-live-chat-membership-item-renderer">${message}</div>
                            <div id="input-container" class="style-scope yt-live-chat-membership-item-renderer">
                                <dom-if class="style-scope yt-live-chat-membership-item-renderer"><template is="dom-if"></template></dom-if>
                            </div>
                            <yt-formatted-string id="deleted-state" class="style-scope yt-live-chat-membership-item-renderer">
                                <!--css-build:shady-->
                            </yt-formatted-string>
                        </div>
                    </div>
                </yt-live-chat-membership-item-renderer>`;
    }
    let detail = {
        "listener": "member-latest",
        "event": {
            "type": "member",
            "name": authorName,
            "items": [],
            "tier": (month == 1) ? "Welcome to Membership!" :"Membership Tier",
            "month": month,
            "message": message,
            "sessionTop": false,
            "originalEventName": "member-latest",
            "profileImage": testAuthorPhoto,
            "amount": month,
            "badge": TEST_BADGE,
            "msgId": `test-message-${testMessageCounter}`
        }
    }
    sendBasicTest(messageHTML, "member-latest");
    sendTestPayload(detail);

}

function addTestGift(amount = 1) {
    let authorName = "Membership Gifter";
    let message = `Gifted ${amount} Channel Name memberships`;
    let messageHTML = `<ytd-sponsorships-live-chat-gift-purchase-announcement-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}">
                    <!--css-build:shady-->
                    <ytd-sponsorships-live-chat-header-renderer id="header" class="style-scope ytd-sponsorships-live-chat-gift-purchase-announcement-renderer">
                        <!--css-build:shady-->
                        <div id="header" class="style-scope ytd-sponsorships-live-chat-header-renderer">
                            <div id="content" class="style-scope ytd-sponsorships-live-chat-header-renderer">

                                <yt-img-shadow id="author-photo" height="40" width="40" class="style-scope ytd-sponsorships-live-chat-header-renderer no-transition" style="background-color: transparent;" loaded="">
                                    <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="40" width="40" src="${testAuthorPhoto}"></yt-img-shadow>
                                <dom-if restamp="" class="style-scope ytd-sponsorships-live-chat-header-renderer"><template is="dom-if"></template></dom-if>
                                <dom-if class="style-scope ytd-sponsorships-live-chat-header-renderer"><template is="dom-if"></template></dom-if>
                                <div id="header-content" class="style-scope ytd-sponsorships-live-chat-header-renderer">
                                    <div id="header-content-primary-column" class="style-scope ytd-sponsorships-live-chat-header-renderer">
                                        <div id="header-content-inner-column" class="style-scope ytd-sponsorships-live-chat-header-renderer">

                                            <yt-live-chat-author-chip single-line="" class="style-scope ytd-sponsorships-live-chat-header-renderer">
                                                <!--css-build:shady--><span id="author-name" dir="auto" class="member single-line style-scope yt-live-chat-author-chip">${authorName}<span id="chip-badges" class="style-scope yt-live-chat-author-chip"></span></span><span id="chat-badges" class="style-scope yt-live-chat-author-chip">
                                                    <yt-live-chat-author-badge-renderer class="style-scope yt-live-chat-author-chip" aria-label="Member (2 months)" type="member" shared-tooltip-text="Member (2 months)">
                                                        <!--css-build:shady-->
                                                        <div id="image" class="style-scope yt-live-chat-author-badge-renderer"><img src="${TEST_BADGE}" alt="Member (2 months)"></div>
                                                    </yt-live-chat-author-badge-renderer>
                                                </span></yt-live-chat-author-chip>
                                            <dom-if restamp="" class="style-scope ytd-sponsorships-live-chat-header-renderer"><template is="dom-if"></template></dom-if>
                                            <div id="primary-text" class="style-scope ytd-sponsorships-live-chat-header-renderer">${message}</div>
                                        </div>
                                        <div id="secondary-text" class="style-scope ytd-sponsorships-live-chat-header-renderer"></div>
                                    </div>
                                    <div id="header-content-deleted-state" class="style-scope ytd-sponsorships-live-chat-header-renderer" hidden="">
                                        <div id="deleted-primary-text" class="style-scope ytd-sponsorships-live-chat-header-renderer"></div>
                                    </div>
                                </div>
                            </div>

                            <yt-img-shadow class="rhs-image style-scope ytd-sponsorships-live-chat-header-renderer no-transition" height="104" width="104" style="background-color: transparent;" loaded="">
                                <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="104" width="104" src="https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png"></yt-img-shadow>
                            <dom-if restamp="" class="style-scope ytd-sponsorships-live-chat-header-renderer"><template is="dom-if"></template></dom-if>
                        </div>
                    </ytd-sponsorships-live-chat-header-renderer>
                </ytd-sponsorships-live-chat-gift-purchase-announcement-renderer>`;

    let detail = {
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
            "profileImage": testAuthorPhoto,
            "amount": amount,
            "badge": TEST_BADGE
        }
    }
    sendBasicTest(messageHTML, "gift-latest");
    sendTestPayload(detail);
    currentSuperTest++;
    let currentWaitTime = 250;
    for (let i = 0; i < amount; i++) {
        currentWaitTime += 25 + Math.floor(Math.random() * 200);
        setTimeout(() => { addTestGiftRedemption(i + 1); }, currentWaitTime);
    }
}

function addTestGiftRedemption(id) {
    let authorName = "Lucky Viewer " + id;
    let gifter = "Membership Gifter";
    let message = `was gifted a membership by ${gifter}`;
    let messageHTML = `<ytd-sponsorships-live-chat-gift-redemption-announcement-renderer class="style-scope yt-live-chat-item-list-renderer" id="test-message-${testMessageCounter}">
                    <!--css-build:shady-->
                    <yt-img-shadow id="author-photo" height="24" width="24" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer no-transition" style="background-color: transparent;" loaded="">
                        <!--css-build:shady--><img id="img" class="style-scope yt-img-shadow" alt="" height="24" width="24" src="${testAuthorPhoto}"></yt-img-shadow>
                    <dom-if restamp="" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer"><template is="dom-if"></template></dom-if>
                    <dom-if class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer"><template is="dom-if"></template></dom-if>
                    <div id="content" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer">
                        <span id="timestamp" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer">10:00 PM</span>
                        <yt-live-chat-author-chip class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer">
                            <!--css-build:shady--><span id="author-name" dir="auto" class="style-scope yt-live-chat-author-chip">${authorName}<span id="chip-badges" class="style-scope yt-live-chat-author-chip"></span></span><span id="chat-badges" class="style-scope yt-live-chat-author-chip"></span></yt-live-chat-author-chip>
                        <dom-if restamp="" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer"><template is="dom-if"></template></dom-if>
                        <yt-formatted-string id="message" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer"><span dir="auto" class="italic style-scope yt-formatted-string">was gifted a membership by </span><span dir="auto" class="bold italic style-scope yt-formatted-string" style-target="bold">${gifter}</span></yt-formatted-string>
                        <yt-icon id="gift-icon" default-to-filled="true" icon="gift" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                                <g class="style-scope yt-icon">
                                    <path d="M19.28,3.61c-0.96-0.81-2.51-0.81-3.47,0C15.13,4.19,14.34,6.27,14,7.25c-0.34-0.98-1.13-3.06-1.81-3.64 c-0.96-0.81-2.51-0.81-3.47,0c-0.96,0.81-0.96,2.13,0,2.94c0.62,0.53,2.7,1.12,3.94,1.45H5v6h8V8h2v6h4V8h-3.66 c1.24-0.32,3.32-0.92,3.94-1.45C20.24,5.74,20.24,4.42,19.28,3.61z M9.43,5.89c-0.58-0.43-0.58-1.13,0-1.57 C9.72,4.11,10.1,4,10.48,4s0.76,0.11,1.04,0.32C11.91,4.61,12.54,5.89,13,7C11.52,6.65,9.82,6.18,9.43,5.89z M18.57,5.89 C18.18,6.18,16.48,6.65,15,7c0.46-1.11,1.09-2.39,1.48-2.68C16.77,4.11,17.15,4,17.52,4c0.38,0,0.76,0.11,1.04,0.32 C19.14,4.76,19.14,5.46,18.57,5.89z M5,16h8v5H5V16z M15,16h4v5h-4V16z" class="style-scope yt-icon"></path>
                                </g>
                            </svg>
                            <!--css-build:shady-->
                        </yt-icon>
                        <div id="deleted-message" class="style-scope ytd-sponsorships-live-chat-gift-redemption-announcement-renderer" hidden=""></div>
                    </div>
                </ytd-sponsorships-live-chat-gift-redemption-announcement-renderer>`;

    let detail = {
        "listener": "gift-redemption",
        "event": {
            "type": "gift-redemption",
            "name": authorName,
            "items": [],
            "tier": "1000",
            "month": "",
            "message": message,
            "sessionTop": false,
            "originalEventName": "gift-redemption",
            "profileImage": testAuthorPhoto,
            "sender": gifter
        }
    }
    sendBasicTest(messageHTML, "member-gifted");
    sendTestPayload(detail);
    currentSuperTest++;

    testMessageCounter++;
}

function sendBasicTest(htmlText, event) {
    var detail = {
        "listener": "youtube-basic",
        "event": {
            "type": event,
            "html": htmlText
        }
    }
    sendTestPayload(detail);
}

function sendPayload(detail) {
    connection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString())
    });
}

function sendTestPayload(detail) {
    testConnection.invoke("SendMessage", JSON.stringify(detail)).catch(function (err) {
        return console.error(err.toString());
    });
}