//console.log('HELLO');

const callback = (mutationList, observer) => {
    console.log(mutationList)
    for (const mutation of mutationList) {
        //console.log(mutation)

        if (mutation.addedNodes.length == 0) {
            continue
        }

        var eventData = mutation.addedNodes[0]['$']
        //console.log(eventData)
        var authorName = eventData.content.childNodes[1].childNodes[2].childNodes[0].data;
        var message = eventData.content.childNodes[3].childNodes[0].data;

        var obj = JSON.stringify({
            username: authorName,
            message: message
        });

        //window.boundEvent.raiseEvent('onEventReceived', obj);
        window.chrome.webview.postMessage(obj);
    }
};

const observer = new MutationObserver(callback);
observer.observe(document.querySelector("yt-live-chat-item-list-renderer #items"), { subtree: false, childList: true });

