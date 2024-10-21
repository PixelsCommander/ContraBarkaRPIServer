const { parse } = require('macaddr');
const { cloudLogin, loginDeviceByIp } = require("tp-link-tapo-connect");
const arp = require("@network-utils/arp-lookup");

const express = require('express')
const app = express()
const port = 5001

app.get('/', (req, res) => {
    if (req.query.deviceName) {
        // @ts-ignore
        const device = devicesCache[req.query.deviceName];
        console.log('Device name from request', req.query.deviceName);
        res.status(200).json({ message: 'Switching the device' })
        switchDevice(device, req.query.turnOn === 'true');
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const email = 'denis.radin@gmail.com';
const pass = 'Extremeg2!';
const devicesCache = {};

init();
async function init() {
    const cloudApi = await cloudLogin(email, pass);
    const devicesList = await cloudApi.listDevicesByType('SMART.TAPOPLUG');

    console.log(devicesList);

    devicesList.forEach(device => {
        devicesCache[device.alias] = device;
    });
}

const tidyMac = (mac) =>
    parse(mac).toString();
async function switchDevice(device, turnOn) {
    console.log('Switching device', device.alias);
    const validMac = tidyMac(device.deviceMac);
    const ip = await arp.toIP(validMac);

    if (ip) {
        console.log('Device IP', ip);
        const deviceToSwitch = await loginDeviceByIp(email, pass, ip);

        if (deviceToSwitch) {
            console.log('Device is', turnOn);

            if (turnOn) {
                deviceToSwitch.turnOn();
            } else {
                deviceToSwitch.turnOff();
            }
        }
    }
}
