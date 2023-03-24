const CURRENTVERSION = 'BETAv0.6-chronut'

var activeWidget = "";
var groupList = [];
var widgetData = {};
var isYtVisible = false;
var activeTab = 'home';
var defaultUrl = "http://localhost:6969/tutorial.html";
var lastValidUrl = "";

////////////////////////////////////////////////////////////////////////////////
//                        HELPER FUNCTIONS                                    //
////////////////////////////////////////////////////////////////////////////////

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

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

async function retrieveData(widgetName) {
    if (!widgetName) return;
    fetch(`widgets/${widgetName}/src/data.txt?version=${makeid(10)}`)
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
            let data = {};
            try {
                data = JSON.parse(text);                
            } catch (ex) {
                console.log('Could not parse.')
            }
            updateData(widgetName, data, false);
            widgetData = data;
        })
        .catch((error) => {
            //
        })
}


//widgetData was empty
//need to be on demand
async function updateData(widgetName, data, active=true) {   

    var obj = JSON.stringify({
        "listener": "widget-load",
        "name": widgetName,
        "value": JSON.stringify(data),
        "active": active
    })

    if (widgetName != "all") {
        window.chrome.webview.postMessage(obj);
    }

    connection.invoke("SendMessage", obj).catch(function (err) {
        return console.error(err.toString());
    });
    return;
}

async function updateUI() {
    //console.log(activeWidget)
    console.log($('#widget-select').val());
    /* if ($('#widget-select').val() != 'idle') {
        $('#widget-select option[value="idle"]').remove();
        $('#widget-select').selectmenu('refresh')
    } */
    fetch(`widgets/${activeWidget}/src/fields.json?version=${makeid(10)}`)
        .then(response => {
            console.log(response)
            if (response.ok) {
                return response.text()
            }
            else {
                $('.empty').show();
                throw new Error('{}', { cause: "Not found" })     
            }
        })
        .then(text => {
            if (text) {
                if (text != '[]') {
                    $('.empty').hide();
                }
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
        updateData(activeWidget, widgetData);
    }
}

function handleFieldSettings(data) {
    console.log(data)
    for (var field in data) {
        var setting = data[field];

        //for number inputs
        let min = 0;
        let max = 0;
        let step = 0;

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
                    updateData(activeWidget, widgetData);
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
                    updateData(activeWidget, widgetData);
                    $('iframe').attr('src', function (i, val) { return val; });
                });
                break;

            case "text":
                var textNumber = $(`
                    <h4>${setting["label"]}</h4>
                    <input type="text" id="text__${field}" placeholder="Type here..."></input>
                `);

                appendSetting(setting, textNumber);

                $(`#text__${field}`).val(widgetData[field]);
                $(`#text__${field}`).on('change', (evt) => {
                    console.log(evt);
                    var key = evt.currentTarget.id.split('_')[2];
                    widgetData[key] = evt.currentTarget.value;
                    updateData(activeWidget, widgetData);
                    $('iframe').attr('src', function (i, val) { return val; });
                })

                break;


            case "number":
                let numberMin = "";
                let numberMax = "";
                

                if (!isNaN(setting["min"])) {
                    numberMin = ` min="${setting["min"]}"`;
                    min = parseFloat(setting["min"]);
                }

                if (!isNaN(setting["max"])) {
                    numberMax = ` max="${setting["max"]}"`;
                    max = parseFloat(setting["max"]);
                }

                var textNumber = $(`
                    <h4>${setting["label"]}</h4>
                    <input type="number" id="number__${field}"  ${numberMin} ${numberMax} placeholder="Type here..."></input>
                `);

                appendSetting(setting, textNumber);

                $(`#number__${field}`).val(widgetData[field]);
                $(`#number__${field}`).on('change', (evt) => {
                    console.log(evt);

                    if (numberMin) {
                        evt.currentTarget.value = Math.max(min, evt.currentTarget.value);
                    }
                    if (numberMax) {
                        evt.currentTarget.value = Math.min(max, evt.currentTarget.value);
                    }

                    var key = evt.currentTarget.id.split('_')[2];
                    widgetData[key] = evt.currentTarget.value;
                    updateData(activeWidget, widgetData);
                    $('iframe').attr('src', function (i, val) { return val; });
                })

                break;

            case "slider":
                let ok = 0;

                if (!isNaN(setting["min"])) {
                    min = parseFloat(setting["min"]);
                    ok++;
                }

                if (!isNaN(setting["max"])) {
                    max = parseFloat(setting["max"]);
                    ok++;
                }

                if (!isNaN(setting["step"])) {
                    step = parseFloat(setting["step"]);
                }
                else {
                    step = (max - min) / 10;
                }

                if (ok < 2) break;

                var textSlider = $(`
                    <h4>${setting["label"]}</h4>
                    <input type="range" id="slider__${field}" min="${min}" max="${max}" step="${step}" placeholder="Type here..."></input>
                    <span id="slider__${field}_value">Value:</span>
                `);

                appendSetting(setting, textSlider);

                $(`#slider__${field}`).val(widgetData[field]);
                $(`#slider__${field}_value`).text(`Value: ${$(`#slider__${field}`).val()}`);
                $(`#slider__${field}`).on('change', (evt) => {
                    console.log(evt);
                    var key = evt.currentTarget.id.split('_')[2];
                    $(`#${evt.currentTarget.id}_value`).text(`Value: ${evt.currentTarget.value}`);
                    widgetData[key] = evt.currentTarget.value;
                    updateData(activeWidget, widgetData);
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
                    $(`#picker__${field}.picker-container`).css({ 'left': leftPos, 'top': topPos })
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

        //initOnloadData();

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
        retrieveData(evt.name);
    }
});
/*
function initOnloadData() {
    
    $("#widget-select option").each(function () {
        console.log("INIT LOAD DATA "+name);

        let name = $(this).val();
        if (name != "idle" && name != "add") {
            retrieveData(name);
        }        
    });
}*/

///////////////////* SIDEBAR BUTTONS *//////////////////////////////////////////

$('#youtube-button').click(() => {
    setActivePage('youtube-button', 'youtube');
});

$('#login-button').click(() => {
    setActivePage('login-button', 'login');
});

$('#home-button').click(() => {
    setActivePage('home-button', 'home');
});

$('#store-button').click(() => {
    setActivePage('store-button', 'store');
});

$('#theme-button[type="dark-mode"]').click(() => {
    //save theme selection later?
    $('#app').toggleClass("app-theme-dark");
    $('#app').toggleClass("app-theme-light");
});

$('#theme-button[type="update"]').click(() => {
    obj = JSON.stringify({
        "listener": "toggle-update"
    })
    window.chrome.webview.postMessage(obj);
});


function setActivePage(buttonId, pageId) {

    if (activeTab == pageId) return;

    $('.search-bar').removeClass("animate");
    let toggleChat = false;

    if ((pageId == 'youtube' || pageId == 'login')) {
        toggleChat = true;
        $('.app').css('background', 'transparent');
    }
    else {
        $('.app').css('background', '');
    }

    var obj = JSON.stringify({
        "listener": "toggle-chat",
        "value": toggleChat
    })
    if (pageId == 'login') {
        obj = JSON.stringify({
            "listener": "toggle-login",
            "value": true
        })
    }
    window.chrome.webview.postMessage(obj);

    isYtVisible = toggleChat;

    if (activeTab == 'login') {
        //reset the url
        changeUrl(false);
    }

    $(`#${activeTab}-button`).removeClass('sidebar-button-active');
    $(`#${activeTab}`).removeClass('active').addClass('hidden');
    $('#' + buttonId).addClass('sidebar-button-active');
    $(`#${pageId}`).removeClass('hidden').addClass('active');
    $(`.nav`).removeClass('active').addClass('hidden');

    activeTab = pageId;
}

$('#fullscreen').click(() => {
    console.log('toggling fullscreen');
    var obj = JSON.stringify({
        "listener": "toggle-fullscreen",
        "value": null
    })
    window.chrome.webview.postMessage(obj);
});
$('#link-input').on('keypress', function (e) {
    if (e.which == 13) {
        changeUrl();
        return false;
    }
});
$('#search').click(() => {
    changeUrl();
});

const searchIconName = $('#search>span').html();

function changeUrl(animate = true) {
    var url = $('#link-input').val();
    let valid = true;

    //only accepts valid chat links
    if (url) {
        if (url.startsWith("https://youtube.com/live/")) {
            url = "https://www.youtube.com/live_chat?v=" + url.replace("https://youtube.com/live/", "");
            $('#link-input').val(url);
        }
        else if (url.startsWith("https://www.youtube.com/watch?v=")) {
            url = "https://www.youtube.com/live_chat?v=" + url.replace("https://www.youtube.com/watch?v=", "");
            $('#link-input').val(url);
        }
        else if (url.startsWith("https://studio.youtube.com/video/")) {
            url = "https://www.youtube.com/live_chat?v=" + url.replace("https://studio.youtube.com/video/", "").replace("/livestreaming", "");
            $('#link-input').val(url);
        }
    }

    if (!isValid(url)) {
        valid = false;
    }

    //if from login page
    if (!valid && animate == false) {
        if (!lastValidUrl) {
            var obj = JSON.stringify({
                "listener": "change-url",
                "value": defaultUrl
            })
            window.chrome.webview.postMessage(obj);
            return;
        }
        url = lastValidUrl;
        valid = true;
    }

    if (!valid) {
        $('#search').addClass("error");
        $('#search>span').html("close");
        setTimeout(() => {
            $('#search').removeClass("error");
            $('#search>span').html(searchIconName);
        }, 1600);

        setTimeout(() => {
            $('.search-bar').addClass("animate");
        }, 10);

        $("#link-error-notification").css("display", "block");

        return;
    }
    else {
        $("#link-error-notification").css("display", "none");
    }

    lastValidUrl = url;
    

    var obj = JSON.stringify({
        "listener": "change-url",
        "value": url
    })
    window.chrome.webview.postMessage(obj);

    if (animate) {
        let iconName = $('#search>span').html();
        $('#search').addClass("ok");
        $('#search>span').html("done");
        setTimeout(() => {
            $('#search').removeClass("ok");
            $('#search>span').html(iconName);
        }, 1600);
    }
}

function isValid(url) {
    if (!url) return false;
    return url.startsWith("https://www.youtube.com/live_chat?") || url.startsWith("https://studio.youtube.com/live_chat?");
}

$('#refresh-widget').click(() => {
    var obj = JSON.stringify({
        "listener": "refresh-widget",
        "name": activeWidget
    })
    //disabling this until more reliable
    /*
    $('#settings__editor').remove();
    $('.editor').append('<div id="settings__editor"></div>')

    groupList = [];
    widgetData = {};

    window.chrome.webview.postMessage(obj);

    setTimeout(() => {
        $('iframe')[0].contentWindow.location.reload('true');
    }, 1000)*/

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
    /* $('#widget-select').prepend('<option value="idle" id="idle">Select widget</option>'); */
    $('#widget-select').val('idle');
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
    retrieveData(activeWidget)
        .then(updateUI())
});

window.addEventListener('DOMContentLoaded', () => {

    $('#widget-select').selectmenu();


    $("#app-version").text(CURRENTVERSION);

    // CHECK FOR UPDATES
    fetch(`https://mccw.studio/widgetstatus/sigmanuts.txt?version=${makeid(10)}`)
        .then(response => response.text())
        .then(text => {
            console.log(text);
            if (CURRENTVERSION === text) {
                $('#theme-button[type="update"]').hide();
                $('#update-text').hide();
            }
        })

    // Do active tab setup
    $(`#home`).removeClass('hidden').addClass('active');
    $('#home-button').addClass('sidebar-button-active');
    $(`.nav`).removeClass('hidden').addClass('active');
    activeTab = 'home';

    $('#refresh-widget').hide();
    $('#remove').hide();

    // Fetch cached youtube chat link
    fetch(`config.ini?version=${makeid(10)}`)
        .then(response => response.text())
        .then(text => {
            console.log(text);
            if (isValid(text)) {
                lastValidUrl = text;
                $('#link-input').val(text);
            }
        })

    // Fetch widget list
    setTimeout(() => {
        fetch(`widgets/widgets.ini?version=${makeid(10)}`)
            .then(response => response.text())
            .then(text => {
                var lines = text.split('\n')
                console.log(lines)
                lines.forEach(element => {
                    if (element !== "") {
                        var name = element.split("\\")
                        name = name[name.length - 1];

                        name = name.replace(/\\"/g, '"').replace(/(\r\n|\n|\r)/gm, "")

                        $('#widget-select').append(`<option value="${name}" id="${name}">${name}</option>`)
                    }
                });
                $('#widget-select').prepend(`<option disabled value="idle" id="idle">Select widget</option>`)
                $('#widget-select').append(`<option value="add" id="add">Create widget...</option>`)
                $('#widget-select').val(`YouTube`).selectmenu('refresh').trigger("selectmenuchange");

            })
    }, 500)

    setTimeout(() => {
        fetch(`widgets/activeWidget.active?version=${makeid(10)}`)
            .then(response => response.text())
            .then(text => {
                activeWidget = text.replace(/\\"/g, '"').replace(/(\r\n|\n|\r)/gm, "");
            })
            .then(() => {
                start()
            });

    }, 600);
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
    } else {
        //$('.backdrop-wrapper').hide('fast');
    }

    if (obj.currentTarget.value === "YouTube") {
        $('#refresh-widget').hide();
        $('#remove').hide();
        $('#zip-upload').hide();
    } else {
        $('#refresh-widget').show();
        $('#remove').show();
        $('#zip-upload').show();
    }

    $('#settings__editor').remove();
    $('.editor').append('<div id="settings__editor"></div>')

    groupList = [];
    widgetData = {};

    var obj = JSON.stringify({
        "listener": "change-widget",
        "value": $(`#widget-select-button .ui-selectmenu-text`).text().replace(/(\r\n|\n|\r)/gm, "")
    })

    activeWidget = $('#widget-select-button .ui-selectmenu-text').text().replace(/(\r\n|\n|\r)/gm, "");

    $('iframe').attr('src', `widgets/${activeWidget}/widget.html`)

    window.chrome.webview.postMessage(obj);
    retrieveData(activeWidget)
        .then(updateUI())
});

//new widget cancel
$('.backdrop-wrapper').on('click', (e) => {
    console.log(e);
    if (e.target === $('.backdrop')[0]) {
        $('.backdrop-wrapper').hide();
    }
    $('#widget-select').val(`idle`).selectmenu('refresh').trigger("selectmenuchange");
});

$('#copy-link').on('click', () => {
    var copyField = document.getElementById('copy-link-text');
    copyField.value = `localhost:6969/widgets/${activeWidget}/widget.html`;
    copyField.select();
    navigator.clipboard.writeText(copyField.value);

    $('#copy-link>#text').text("Copied");
    setTimeout(() => { $('#copy-link>#text').text("Copy chat link"); }, 2000)
});

$('#test-message').on('click', () => {
    sendTestMessage("test-message");
});
$('#test-superchat').on('click', () => {
    sendTestMessage("test-superchat");
});
$('#test-sticker').on('click', () => {
    sendTestMessage("test-sticker");
});
$('#test-member').on('click', () => {
    sendTestMessage("test-member");
});
$('#test-gift').on('click', () => {
    sendTestMessage("test-gift");
});

$('#open-folder').on('click', () => {
    var obj = JSON.stringify({
        "listener": "open-folder",
        "value": null
    })
    window.chrome.webview.postMessage(obj);
});

function sendTestMessage(type) {

    var obj = JSON.stringify({
        "listener": "test-message",
        "type": type
    })

    window.chrome.webview.postMessage(obj);
}
