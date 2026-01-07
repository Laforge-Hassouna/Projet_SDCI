var express = require('express');
var app = express();
app.use(express.json()); // for parsing application/json

var request = require('request');
var argv = require('yargs').argv;
// --local_ip
// --local_port
// --local_name
// --remote_ip
// --remote_port
// --remote_name

var LOCAL_ENDPOINT = { IP: argv.local_ip, PORT: argv.local_port, NAME: argv.local_name };
var REMOTE_ENDPOINT = { IP: argv.remote_ip, PORT: argv.remote_port, NAME: argv.remote_name };

const E_OK = 200;
const E_CREATED = 201;
const E_FORBIDDEN = 403;
const E_NOT_FOUND = 404;
const E_ALREADY_EXIST = 500;

var db = {
    gateways: new Map()
};

// Function to send a single packet to the remote endpoint
function sendPacket(device, packet) {
    doPOST(
        'http://' + REMOTE_ENDPOINT.IP + ':' + REMOTE_ENDPOINT.PORT + '/device/' + device + '/data',
        packet,
        function (error, response, respBody) {
            if (error) {
                console.error('Failed to send packet for device ' + device + ':', error);
            } else {
                console.log('Packet for device ' + device + ' sent successfully:', respBody);
            }
        }
    );
}

// Function to perform a POST request
function doPOST(uri, body, onResponse) {
    request({ method: 'POST', uri: uri, json: body }, onResponse);
}

// Function to register the gateway
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

// Function to decode a multi-value packet and send each value as a separate packet
function decodeAndSend(device, bufferedData) {
    if (bufferedData && bufferedData.data && Array.isArray(bufferedData.data)) {
        bufferedData.data.forEach(packet => {
            sendPacket(device, packet);
        });
    } else {
        console.error('Invalid buffered data format for device ' + device);
    }
}

// Endpoint to receive buffered data and decode it
app.post('/device/:dev/buffered-data', function (req, res) {
    var dev = req.params.dev;
    console.log('Received buffered data for device ' + dev + ':', req.body);

    // Decode and send each packet separately
    decodeAndSend(dev, req.body);

    res.sendStatus(E_OK);
});

// Existing endpoints
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
    );
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
    });
});

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

register();
app.listen(LOCAL_ENDPOINT.PORT, function () {
    console.log(LOCAL_ENDPOINT.NAME + ' listening on: ' + LOCAL_ENDPOINT.PORT);
});
