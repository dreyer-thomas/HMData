HomeMaticCCU = require('./HomeMatic');
db = require('./database');
var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var configRouter = require('./routes/config');
var dataRouter = require('./routes/data');
var path = require('path');

//construct Homematic Driver
var hm = new HomeMaticCCU();

// register new Devices
hm.registerNewDevices( db.handleNewDevices );
hm.registerEvent( db.handleEvent );
console.log('Homematic initialized')

//start the Server
hm.createServer('192.168.178.45','2001','192.168.178.36','1990');
console.log('XML-RPC server started');

//initialize REST server using express framework
var app = express();

app.all('*', (req, res, next) => {
    return next();
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/config', configRouter);
app.use('/data', dataRouter);

//handle static ressources
app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  
  module.exports = app;