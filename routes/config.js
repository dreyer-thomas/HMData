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

configRouter.route('/measurements')
.get( (req,res,next) => {
    database.getMeasurements()
    .then( (measurements) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 200;
        res.json(measurements);
    })
})
.post( (req,res,next) => {
    database.insertMeasurment(req.body.channel, req.body.measurement, req.body.type);
    res.statusCode = 200;
    res.end('Measurement '+req.body.channel+'/'+req.body.measurement+' set to '+req.body.type);
});

configRouter.route('/measurements/:id')
.get( (req,res,next) => {
    database.getMeasurment(req.params.id)
    .then( (measurement) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 200;
        res.json(measurement);
    })
    .catch( (err) => {
        res.setHeader('Content-Type','application/json');
        res.statusCode = 500;
        res.json(err);
    })

})
.delete( (req,res,next) => {
    database.deleteMeasurement(req.params.id);
    res.setHeader('Content-Type','application/json');
    res.statusCode = 200;
    res.end("{statusCode: 200, result:'deleted'}");
});

module.exports = configRouter;