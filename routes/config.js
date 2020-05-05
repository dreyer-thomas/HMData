const express = require('express');
const bodyParser= require('body-parser');
const database = require('../database');

//construct the mini express app
const configRouter = express.Router();

//parse the body into JSON format
configRouter.use(bodyParser.json());

//define the API for /dishes
configRouter.route('/')
.all( (req, res, next) => {
    res.statusCode = 403;
    res.end('path /config does not allow any services');
});

configRouter.route('/devices')
.get( (req,res,next) => {
    database.getDevices()
    .then( (devices) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 200;
        res.json(devices);
    })
    .catch( (err) => {
        res.statusCode = 500;
        res.end('Error reading db');
    });
}).all( (req,res, next) => {
    res.statusCode = 403;
    res.end('path /config/devices coming soon');
});

configRouter.route('/devices/:deviceId')
.get( (req,res,next) => {
    database.getDevice(req.params.deviceId)
    .then( (device) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 200;
        res.json(device);
    })
    .catch( (err) => {
        res.statusCode = 500;
        res.end('Error reading db');
    });
})
.all( (req,res, next) => {
    res.statusCode = 403;
    res.end('path /config/channels coming soon');
});

configRouter.route('/channels')
.get( (req,res,next) => {
    database.getChannels()
    .then( (channels) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 200;
        res.json(channels);
    })
    .catch( (err) => {
        res.statusCode = 500;
        res.end('Error reading db');
    });
})
.all( (req,res, next) => {
    res.statusCode = 403;
    res.end('path /config/channels coming soon');
});



module.exports = configRouter;