var activeWidget;
var groupList = [];
var widgetData = {};

////////////////////////////////////////////////////////////////////////////////
//                        HELPER FUNCTIONS                                    //
////////////////////////////////////////////////////////////////////////////////

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function compareKeys(a, b) {
    var aKeys = Object.keys(a).sort();
    var bKeys = Object.keys(b).sort();
    return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

function appendSetting(setting, el) {
    if (setting["group"]) {
        $(`#${setting["group"].replace(/ /g, '')} + div`).append(el)
    } else {
        $('#settings__editor').append(el)
    }
}

////////////////////////////////////////////////////////////////////////////////
//                          MAIN FUNCTIONS                                    //
////////////////////////////////////////////////////////////////////////////////

async function retrieveData() {
    fetch(`widgets/${activeWidget}/src/data.txt`)
        .then(response => {
            console.log(response)
            if (response.ok) {
                return response.text()
            }
            else {
                throw new Error('{}', { cause: "Not found" })
            }
        })
        .then(text => {
            try {
                widgetData = JSON.parse(text)
            } catch (ex) {
                console.log('Could not parse.')
                widgetData = {};
            }
        })
        .catch((error) => {
            //
        })
}

function updateData(widget) {
    var obj = JSON.stringify({
        "listener": "widget-load",
        "name": widget,
        "value": JSON.stringify(widgetData)
    })

    if (widget != "all") {
        window.chrome.webview.postMessage(obj);
    }

    connection.invoke("SendMessage", obj).catch(function (err) {
        return console.error(err.toString());
    });
}

async function updateUI() {
    console.log(activeWidget)
    fetch(`widgets/${activeWidget}/src/fields.json`)
        .then(response => {
            console.log(response)
            if (response.ok) {
                return response.text()
            }
            else {
                throw new Error('{}', { cause: "Not found" })
            }
        })
        .then(text => {
            if (text) {
                handleFieldGroups(JSON.parse(text));
                handleFieldSettings(JSON.parse(text));
                $('#settings__editor').accordion({
                    heightStyle: "content"
                })
            }
        }).catch((error) => {
            //
        })
}

function handleFieldGroups(data, defaultData) {
    var _widgetData = {};
    console.log(data)
    for (var field in data) {
        var setting = data[field];

        if (setting["group"] && !groupList.includes(`${setting["group"]}`)) {
            groupList.push(setting["group"])
            var groupElement = $(`
                <h3 id="${setting["group"].replace(/ /g, '')}">${setting["group"]}</h3>`)
            $('#settings__editor').append(groupElement)
            $('#settings__editor').append('<div class="accordion__content"></div>')
        }

        _widgetData[field] = setting["value"];
    }

    if (!compareKeys(widgetData, _widgetData)) {
        widgetData = _widgetData
        updateData(activeWidget);
    }
}

function handleFieldSettings(data) {
    console.log(data)
    for (var field in data) {
        var setting = data[field];

        switch (setting["type"]) {
            case "dropdown":
                // Handle dropdown
                var dropdown = $(`
                    <h4>${setting["label"]}</h4>
                    <select id="dropdown__${field}"></select>
                `)

                appendSetting(setting, dropdown);

                for (option in setting["options"]) {
                    $(`#dropdown__${field}`).append(`
                        <option value="${option}" name="${option}">
                            ${setting["options"][option]}
                        </option>
                    `)
                }

                $(`#dropdown__${field}`).selectmenu()
                $(`#dropdown__${field}`).val(widgetData[field]);
                $(`#dropdown__${field}`).selectmenu('refresh')

                $(`#dropdown__${field}`).on('selectmenuchange', (evt) => {
                    var key = evt.currentTarget.id.split('_')[2]
                    widgetData[key] = $(evt.currentTarget).val()
                    updateData(activeWidget);
                    $('iframe').attr('src', function (i, val) { return val; });
                });
                break;

            case "checkbox":
                var checkbox = $(`
                    <input type="checkbox" id="checkbox__${field}"></input>
                    <label for="checkbox__${field}">${setting["label"]}</label>
                `)

                appendSetting(setting, checkbox);

                $(`#checkbox__${field}`).checkboxradio();
                $(`#checkbox__${field}`).prop('checked', widgetData[field]);
                $(`#checkbox__${field}`).button('refresh');

                $(`#checkbox__${field}`).on('change', (evt) => {
                    var key = evt.currentTarget.id.split('_')[2];
                    widgetData[key] = evt.currentTarget.checked;
                    updateData(activeWidget);
                    $('iframe').attr('src', function (i, val) { return val; });
                });
                break;

            case "text":
                var text = $(`
                    <h4>${setting["label"]}</h4>
                    <input type="text" id="text__${field}" placeholder="Type here..."></input>
                `);

                appendSetting(setting, text);

                $(`#text__${field}`).val(widgetData[field]);
                $(`#text__${field}`).on('change', (evt) => {
                    console.log(evt);
                    var key = evt.currentTarget.id.split('_')[2];
                    widgetData[key] = evt.currentTarget.value;
                    updateData(activeWidget);
                    $('iframe').attr('src', function (i, val) { return val; });
                })

                break;

            case "colorpicker":
                var picker = $(`
                    <h4>${setting["label"]}</h4>
                    <div class="picker color-picker__${field}">
                        <input type="text" id="text__${field}" placeholder="Type here..."></input>
                        <span id="${field}" style="background: ${widgetData[field]}"></span>
                    </div>
                `)
                
                appendSetting(setting, picker); 
                $('body').append(`<div class="picker-container" id="picker__${field}"></div>`);
                $(`#text__${field}`).val(widgetData[field]);

                var colorPicker = new iro.ColorPicker(`#picker__${field}`, {
                    width: 200,
                    layout: [
                        {
                          component: iro.ui.Box,
                          options: {
                            borderColor: '#ffffff',
                            borderWidth: 2
                          }
                        },
                        {
                          component: iro.ui.Slider,
                          options: {
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            sliderType: 'hue'
                          }
                        }
                      ]
                });

                $(`.color-picker__${field} span`).click((evt) => {
                    let field = evt.currentTarget.id;
                    let position = $(`.color-picker__${field} span`).offset();
                    let leftPos = position.left - 210 + 'px';
                    let topPos = position.top - 10 + 'px';
                    $(`#picker__${field}.picker-container`).css({'left': leftPos, 'top': topPos})
                    $(`#picker__${field}`).toggle('fast');
                });
                
                break;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
//                              MAIN SCRIPT                                   //
////////////////////////////////////////////////////////////////////////////////

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

connection.on("ReceiveMessage", function (obj) {
    var evt = JSON.parse(obj);
    console.log(evt)

    if (evt.listener === "request-data") {
        updateData(evt.name);
    }
});

$('#ytchat').click(() => {
    console.log('toggling yt chat');
    var obj = JSON.stringify({
        "listener": "toggle-chat",
        "value": null
    })
    window.chrome.webview.postMessage(obj);
});

$('#fullscreen').click(() => {
    console.log('toggling fullscreen');
    var obj = JSON.stringify({
        "listener": "toggle-fullscreen",
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

$('#refresh-widget').click(() => {
    var obj = JSON.stringify({
        "listener": "refresh-widget",
        "name": activeWidget
    })

    $('#settings__editor').remove();
    $('.editor').append('<div id="settings__editor"></div>')

    groupList = [];
    widgetData = {};

    window.chrome.webview.postMessage(obj);

    setTimeout(() => {
        $('iframe')[0].contentWindow.location.reload('true');
    }, 1000)

    /* connection.on("ReceiveMessage", function (obj) {
        var evt = JSON.parse(obj);
        console.log(evt)
    
        if (evt.listener === "request-data") {
            $('iframe')[0].contentWindow.location.reload('true');
            connection.D.receivemessage[1] = null;
            return
        }
    }); */
});

$('#remove').click(() => {
    if (activeWidget === "Select widget") {
        return
    }

    $(`#${activeWidget.replace(/(\r\n|\n|\r)/gm, "")}`).remove();
    $('#widget-select').selectmenu("refresh");

    $('#widget-select').val('idle')
    $('#widget-select').selectmenu("refresh");

    var obj = JSON.stringify({
        "listener": "delete-widget",
        "name": activeWidget.replace(/(\r\n|\n|\r)/gm, "")
    })

    $('#settings__editor').remove();
    $('.editor').append('<div id="settings__editor"></div>')

    groupList = [];
    widgetData = {};

    window.chrome.webview.postMessage(obj);
    activeWidget = $('#widget-select-button .ui-selectmenu-text').text().replace(/(\r\n|\n|\r)/gm, "")
    retrieveData()
        .then(updateUI())
});

$('#widget-select').selectmenu();

window.addEventListener('DOMContentLoaded', () => {
    // Start the connection.

    fetch('config.ini')
        .then(response => response.text())
        .then(text => {
            $('#link-input').val(text);
        })

    setTimeout(() => {
        fetch('widgets/widgets.ini')
            .then(response => response.text())
            .then(text => {
                var lines = text.split('\n')
                console.log(lines)
                lines.forEach(element => {
                    if (element !== "") {
                        var name = element.split("\\")
                        name = name[name.length - 1].replace(/(\r\n|\n|\r)/gm, "")

                        $('#widget-select').append(`<option value="${name}" id="${name}">${name}</option>`)
                    }
                });
            })
            .then(() => {
                $('#widget-select').prepend(`<option disabled selected value="idle" id="idle">Select widget</option>`)
                $('#widget-select').append(`<option value="add" id="add">Create widget...</option>`)
                $('#widget-select').val(`idle`)
                $('#widget-select').selectmenu('refresh')
            })
    }, 1000)

    setTimeout(() => {
        fetch('widgets/activeWidget.active')
            .then(response => response.text())
            .then(text => {
                activeWidget = text.replace(/\\"/g, '"').replace(/(\r\n|\n|\r)/gm, "");
            })
            .then(() => {
                start()
            });
    }, 1100);
});

$('#widget-select').on('selectmenuchange', (obj) => {

    if (obj.currentTarget.value === "add") {
        $('.backdrop-wrapper').show('fast');
        $('#name').click(() => {
            if ($('#name-input').val() != "") {
                var name = $('#name-input').val();
                name = name.replace(/\s/g, "");
                var obj = JSON.stringify({
                    "listener": "create-widget",
                    "name": name
                })
                $('#add').remove();
                $('#widget-select').selectmenu('refresh')
                $('#widget-select').append(`<option value="${name}" id="${name}">${name}</option>`).selectmenu("refresh");
                $('#widget-select').append(`<option value="add" id="add">Create widget...</option>`).selectmenu("refresh");

                $('#widget-select').val(`${name}`)
                $('#widget-select').selectmenu('refresh')

                $('.backdrop-wrapper').hide('fast');
                $('#name-input').val("");
                window.chrome.webview.postMessage(obj);

                activeWidget = $('#widget-select-button .ui-selectmenu-text').text().replace(/(\r\n|\n|\r)/gm, "")
                var obj = JSON.stringify({
                    "listener": "change-widget",
                    "value": $(`#widget-select-button .ui-selectmenu-text`).text().replace(/(\r\n|\n|\r)/gm, "")
                })
                window.chrome.webview.postMessage(obj);
                return
            }
        });
    }

    $('#settings__editor').remove();
    $('.editor').append('<div id="settings__editor"></div>')

    groupList = [];
    widgetData = {};

    var obj = JSON.stringify({
        "listener": "change-widget",
        "value": $(`#widget-select-button .ui-selectmenu-text`).text().replace(/(\r\n|\n|\r)/gm, "")
    })

    activeWidget = $('#widget-select-button .ui-selectmenu-text').text().replace(/(\r\n|\n|\r)/gm, "")

    $('iframe').attr('src', `widgets/${activeWidget}/widget.html`)

    window.chrome.webview.postMessage(obj);
    retrieveData()
        .then(updateUI())
});