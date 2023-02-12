var widgetName = window.location.pathname.split("/")[2];

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function requestData() {
    var obj = JSON.stringify({
        "listener": "request-data",
        "name": widgetName
    })

    connection.invoke("SendMessage", obj).catch(function (err) {
        return console.error(err.toString());
    });
}

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:6970/stream")
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.elapsedMilliseconds < 10000) {
                // Retry every 5 seconds until 10 seconds elapsed
                return 5000;
            }
            else if (retryContext.elapsedMilliseconds < 300000) {
                // Retry every 12 seconds until 5 minutes elapsed
                return 12000;
            }
            else if (retryContext.elapsedMilliseconds < 900000) {
                // Retry every 60 seconds until 15 minutes elapsed
                return 60000;
            }
            else {
                // Stop reconnecting after 15 minutes elapsed, chat browser needs to be refreshed
                return null;
            }
        }
    })
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

connection.onreconnected(connectionId => {
    //send an event on reconnection
    //if the browser is opened before the app loads
    //maybe rename later
    let newUrl = "";//request from app.js
    const event = new CustomEvent('onEventReceived', {
        detail: {
            event: {},
            listener: "reconnect"
        }
    });
    window.dispatchEvent(event);
});

connection.onclose(async () => {
    await start();
});

connection.on("ReceiveMessage", function (obj) {
    var evt = JSON.parse(obj);
    console.log(evt)

    if (evt.listener === "widget-load" && (evt.name === widgetName || evt.name === "all")) {
        console.log('pog')
        const event = new CustomEvent('onWidgetLoad', {
            detail: {
                fieldData: JSON.parse(evt.value)
            }
        });
        window.dispatchEvent(event)
    } else {
        if(evt.listener === "message")
        {
            evt.event.data.text = decodeHtml(evt.event.data.text)
        }        
        const event = new CustomEvent('onEventReceived', {
            detail: {
                event: evt.event,
                listener: evt.listener
            }
        });
        window.dispatchEvent(event)
    }
});

window.addEventListener('DOMContentLoaded', function (obj) {
    start()
        .then(() => {
            requestData();
        });
})