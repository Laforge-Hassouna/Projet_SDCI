var express = require('express');
var app = express();
app.use(express.json());

var request = require('request');
var argv = require('yargs').argv;
const si = require('systeminformation');

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
const E_NOT_FOUND = 404;
const E_ALREADY_EXIST = 500;

var db = {
    gateways: new Map()
};

// ------------------ HTTP UTILS ------------------

function doPOST(uri, body, onResponse) {
    request({ method: 'POST', uri: uri, json: body }, onResponse);
}

// ------------------ CORE LOGIC ------------------

function sendPacket(device, packet) {
    doPOST(
        `http://${REMOTE_ENDPOINT.IP}:${REMOTE_ENDPOINT.PORT}/device/${device}/data`,
        packet,
        function (error, response, respBody) {
            if (error) {
                console.error(`Failed to send packet for ${device}`, error);
            } else if (respBody !== undefined) {
                console.log(respBody);
            }
        }
    );
}

function decodeAndSend(device, bufferedData) {
    if (!Array.isArray(bufferedData?.data)) {
        console.error(`Invalid buffered data for device ${device}`);
        return;
    }

    bufferedData.data.forEach((packet, index) => {
        setTimeout(() => {
            sendPacket(device, packet);
        }, index * 50); // 50 ms entre paquets
    });
}


// ------------------ API ------------------

app.post('/device/:dev/buffered-data', function (req, res) {
    const dev = req.params.dev;
    decodeAndSend(dev, req.body);
    res.sendStatus(E_OK);
});

app.post('/gateways/register', function (req, res) {
    if (!db.gateways.get(req.body.Name)) {
        db.gateways.set(req.body.Name, req.body);
        res.sendStatus(E_CREATED);
    } else {
        res.sendStatus(E_ALREADY_EXIST);
    }
});

app.post('/devices/register', function (req, res) {
    doPOST(
        `http://${REMOTE_ENDPOINT.IP}:${REMOTE_ENDPOINT.PORT}/devices/register`,
        req.body,
        () => res.sendStatus(E_OK)
    );
});

app.get('/ping', function (req, res) {
    res.status(E_OK).json({ pong: Date.now() });
});

app.get('/health', async function (req, res) {
    try {
        const load = await si.currentLoad();
        res.status(E_OK).json(load);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// ------------------ START ------------------

doPOST(
    `http://${REMOTE_ENDPOINT.IP}:${REMOTE_ENDPOINT.PORT}/gateways/register`,
    {
        Name: LOCAL_ENDPOINT.NAME,
        PoC: `http://${LOCAL_ENDPOINT.IP}:${LOCAL_ENDPOINT.PORT}`,
    },
    () => {}
);

app.listen(LOCAL_ENDPOINT.PORT, function () {
    console.log(`${LOCAL_ENDPOINT.NAME} listening on: ${LOCAL_ENDPOINT.PORT}`);
});
