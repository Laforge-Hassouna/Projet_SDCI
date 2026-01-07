var express = require('express');
var app = express();
app.use(express.json()); // for parsing application/json

var request = require('request');
const si = require('systeminformation');
var argv = require('yargs').argv;
// --local_ip
// --local_port
// --local_name
// --remote_ip
// --remote_port
// --remote_name
// --buffer_size (new parameter for buffer size)

var LOCAL_ENDPOINT = { IP: argv.local_ip, PORT: argv.local_port, NAME: argv.local_name };
var REMOTE_ENDPOINT = { IP: argv.remote_ip, PORT: argv.remote_port, NAME: argv.remote_name };
var BUFFER_SIZE = argv.buffer_size || 10; // Default buffer size: 10 packets

const E_OK = 200;
const E_CREATED = 201;
const E_FORBIDDEN = 403;
const E_NOT_FOUND = 404;
const E_ALREADY_EXIST = 500;

var db = {
    gateways: new Map(),
    buffers: new Map() // Map to store buffers per device
};

function addNewGateway(gw) {
    var res = -1;
    if (!db.gateways.get(gw.Name)) {
        db.gateways.set(gw.Name, gw);
        res = 0;
    }
    return res;
}

function removeGateway(gw) {
    if (db.gateways.get(gw.Name))
        db.gateways.delete(gw.Name);
}

function doPOST(uri, body, onResponse) {
    request({ method: 'POST', uri: uri, json: body }, onResponse);
}

function register() {
    doPOST(
        'http://' + REMOTE_ENDPOINT.IP + ':' + REMOTE_ENDPOINT.PORT + '/gateways/register',
        {
            Name: LOCAL_ENDPOINT.NAME,
            PoC: 'http://' + LOCAL_ENDPOINT.IP + ':' + LOCAL_ENDPOINT.PORT,
        },
        function (error, response, respBody) {
            console.log(respBody);
        }
    );
}

// Function to flush the buffer for a specific device and send data
function flushBuffer(device) {
    if (db.buffers.has(device) && db.buffers.get(device).length > 0) {
        var bufferData = db.buffers.get(device);
        db.buffers.set(device, []); // Clear the buffer for the device

        doPOST(
            'http://' + REMOTE_ENDPOINT.IP + ':' + REMOTE_ENDPOINT.PORT + '/device/' + device + '/buffered-data',
            { data: bufferData },
            function (error, response, respBody) {
                if (error) {
                    console.error('Failed to send buffered data for device ' + device + ':', error);
                } else {
                    console.log('Buffered data for device ' + device + ' sent successfully:', respBody);
                }
            }
        );
    }
}

// Function to add data to the buffer for a specific device and check if it needs to be flushed
function addToBuffer(device, data) {
    if (!db.buffers.has(device)) {
        db.buffers.set(device, []);
    }

    db.buffers.get(device).push(data);

    // Check if buffer size exceeds the limit
    if (db.buffers.get(device).length >= BUFFER_SIZE) {
        flushBuffer(device);
    }
}

app.post('/gateways/register', function (req, res) {
    console.log(req.body);
    var result = addNewGateway(req.body);
    if (result === 0)
        res.sendStatus(E_CREATED);
    else
        res.sendStatus(E_ALREADY_EXIST);
});

app.post('/devices/register', function (req, res) {
    console.log(req.body);
    doPOST(
        'http://' + REMOTE_ENDPOINT.IP + ':' + REMOTE_ENDPOINT.PORT + '/devices/register',
        req.body,
        function (error, response, respBody) {
            console.log(respBody);
            res.sendStatus(E_OK);
        }
    )
});

app.post('/device/:dev/data', function (req, res) {
    console.log(req.body);
    var dev = req.params.dev;

    // Add data to the buffer for the specific device
    addToBuffer(dev, {
        data: req.body,
        timestamp: Date.now()
    });

    res.sendStatus(E_OK);
});

app.get('/gateways', function (req, res) {
    console.log(req.body);
    let resObj = [];
    db.gateways.forEach((v, k) => {
        resObj.push(v);
    });
    res.send(resObj);
});

app.get('/gateway/:gw', function (req, res) {
    console.log(req.body);
    var gw = req.params.gw;
    var gateway = db.gateways.get(gw);
    if (gateway)
        res.status(E_OK).send(JSON.stringify(gateway));
    else
        res.sendStatus(E_NOT_FOUND);
});

app.get('/ping', function (req, res) {
    console.log(req.body);
    res.status(E_OK).send({ pong: Date.now() });
});

app.get('/health', function (req, res) {
    console.log(req.body);
    si.currentLoad((d) => {
        console.log(d);
        res.status(E_OK).send(JSON.stringify(d));
    })
});

register();
app.listen(LOCAL_ENDPOINT.PORT, function () {
    console.log(LOCAL_ENDPOINT.NAME + ' listening on : ' + LOCAL_ENDPOINT.PORT);
});
