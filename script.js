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


var signalRscript = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.js"

loadScript(signalRscript)
    .then(() => {
        startStream()
    })

function startStream() {

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

            connection.invoke("SendMessage", authorName, message).catch(function (err) {
                return console.error(err.toString());
            });

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