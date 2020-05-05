const express = require('express');
const bodyParser= require('body-parser');
const database = require('../database');

//construct the mini express app
const dataRouter = express.Router();

//parse the body into JSON format
dataRouter.use(bodyParser.json());

//define the API for /dishes
dataRouter.route('/')
.all( (req, res, next) => {
    res.statusCode = 403;
    res.end('path /config does not allow any services');
});

//define the API for /dishes
dataRouter.route('/:channelId/:measurementId')
.get( (req,res,next) => {
    database.getDataFromChannel(req.params.channelId, req.params.measurementId, req.query.start, req.query.end)
    .then( (result) => {
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(result);
    })
    .catch( (err) => {
        res.statusCode = 404;
        res.end('no data found');
    });
})
.all( (req, res, next) => {
    res.statusCode = 403;
    res.end('path /config does not allow any services');
});

module.exports = dataRouter;