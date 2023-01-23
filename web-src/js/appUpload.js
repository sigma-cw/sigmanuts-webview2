var codePath;

function handleZip(file) {
    var zip = new JSZip();
    zip.loadAsync(file)
        .then(function (zip) {
            $('.zip-select span').text(file.name)
            if (!zip.files[`widget.ini`]) {
                handleUnsupported(zip)
                return
            }
            zip.files[`widget.ini`].async('string')
                .then((data) => {
                    pathArray = handleIniData(data);
                    if (pathArray.length != 5) {
                        handleUnsupported(zip)
                        return
                    }

                    if (!zip.files[`${pathArray[0]}`] ||
                        !zip.files[`${pathArray[1]}`] ||
                        !zip.files[`${pathArray[2]}`] ||
                        !zip.files[`${pathArray[3]}`] ||
                        !zip.files[`${pathArray[4]}`]) {
                        alert('This widget was not set up properly. Opening manual upload dialog...')
                        handleUnsupported(zip)
                        return
                    }
                    readFiles(zip, pathArray);
                })
        });
}

function handleUnsupported(zip) {
    // alert("This widget is not supported.")
    resetSession()

    waitForElm('#sigma-create-unsupported').then(() => {
        $('#sigma-create-unsupported').click(() => {
            $('#zip').val('')
            $('.zip-select span').text('No file selected...')
            handleCode(codePath)
        });
    });

    filesArray.forEach((type) => {
        waitForElm(`#${type}`).then(() => {
            $(`#${type}`).on("change", function (evt) {
                console.log('Change detected')
                var files = evt.target.files;
                for (var i = 0; i < files.length; i++) {
                    handleFile(files[i], type);
                }
            });
        })
    })

    var backdrop = $(`
        <md-backdrop class="md-dialog-backdrop md-opaque" 
                     style="position: fixed;" aria-hidden="true">
        </md-backdrop>`)
    $('body').prepend(backdrop)
    $('body').append(dialog)

    // Handle click outside of dialog
    $(window).click(() => {
        $('.sigma-extension-dialog').remove()
        $(backdrop).remove()
    })
    $('.sigma-dialog').click((event) => {
        event.stopPropagation();
    })
}

function handleIniData(data) {
    var lines = data.split('\n');
    var pathArray = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].includes('[HTML]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[CSS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[JS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[FIELDS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[DATA]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }
    }

    return pathArray;
}

function readFiles(zip, pathArray) {
    var htmlCode, cssCode, jsCode, fieldsCode, dataCode;
    zip.files[`${pathArray[0]}`].async('string')
        .then((data) => {
            htmlCode = data;
            zip.files[`${pathArray[1]}`].async('string')
                .then((data) => {
                    cssCode = data;
                    zip.files[`${pathArray[2]}`].async('string')
                        .then((data) => {
                            jsCode = data;
                            zip.files[`${pathArray[3]}`].async('string')
                                .then((data) => {
                                    fieldsCode = data;
                                    zip.files[`${pathArray[4]}`].async('string')
                                        .then((data) => {
                                            dataCode = data;
                                            code = [htmlCode, cssCode, jsCode, fieldsCode, dataCode]
                                            window.postMessage([code, 'zip'])
                                            return
                                        });
                                });
                        });
                });
        });
}

window.addEventListener('DOMContentLoaded', () => {
    $('#zip').on("change", function (evt) {
        if (activeWidget === "Select widget") {
            $('#zip').val('')
            return
        }
        var files = evt.target.files;
        for (var i = 0; i < files.length; i++) {
            handleZip(files[i]);
        }
    });
});

window.addEventListener("message", function (event) {
    if (event.data[1] === 'zip') {
        codePath = event.data[0];
        var obj = JSON.stringify({
            "listener": "populate-widget",
            "name": activeWidget,
            "htmlvalue": codePath[0],
            "cssvalue": codePath[1],
            "jsvalue": codePath[2],
            "fieldsvalue": codePath[3],
            "datavalue": codePath[4],
        })
        $('#zip').val('')
        window.chrome.webview.postMessage(obj);
    }
    else if (event.data[1] === 'html') {
        codePath[0] = event.data[0];
    }
    else if (event.data[1] === 'css') {
        codePath[1] = event.data[0];
    }
    else if (event.data[1] === 'js') {
        codePath[2] = event.data[0];
    }
    else if (event.data[1] === 'fields') {
        codePath[3] = event.data[0];
    }
    else if (event.data[1] === 'data') {
        codePath[4] = event.data[0];
    }
});
