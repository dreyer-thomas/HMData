HomeMaticCCU = require('./HomeMatic');
var sqlite = require('sqlite3').verbose();
fs = require('fs');

// open database (or create if not exist)
console.log('Opening database');
var db = new sqlite.Database(':hmdata');

// Create tables
console.log('Creating tables');
db.run("CREATE TABLE IF NOT EXISTS DEVICES ( \
            NAME TEXT, \
            DEVICEID TEXT, \
            DEVICETYPE TEXT, \
            PRIMARY KEY(DEVICEID) \
        )");

db.run("CREATE TABLE IF NOT EXISTS CHANNELS ( \
            NAME TEXT, \
            CHANNELID TEXT, \
            DEVICEID TEXT, \
            PRIMARY KEY(CHANNELID), \
            FOREIGN KEY (DEVICEID) REFERENCES devices(DEVICEID) ON DELETE CASCADE ON UPDATE NO ACTION \
        )");

db.run("CREATE TABLE IF NOT EXISTS ACTUAL_VALUES (\
            CHANNEL TEXT, \
            MEASUREMENT TEXT, \
            VALUE TEXT, \
            TIME TEXT \
        )");


//construct Homematic Driver
var hm = new HomeMaticCCU();


const handleEvent = (err,params) => {  
    var Channel = params[1];
    var Measurement   = params[2];
    var dateTime = new Date().toISOString();
    var Value = params[3];

    stmt = db.prepare("INSERT INTO ACTUAL_VALUES (CHANNEL, MEASUREMENT, VALUE, TIME) VALUES (?,?,?,?)");
    stmt.run(Channel, Measurement, Value, dateTime);
    stmt.finalize();

}

const handleNewDevices = (err,params) => {
    //fs.writeFileSync('./devices.json', JSON.stringify(params[1],null,4));
    for (i=0; i<params[1].length; i++) {
        element = params[1][i];
        if (element.PARENT == "" && element.CHILDREN.length > 0)
        {
            //this is a device
            var Name = element.ADDRESS;
            var DeviceId = Name;
            var DeviceType = element.TYPE;

            stmt = db.prepare('REPLACE INTO DEVICES (NAME, DEVICEID, DEVICETYPE) VALUES (?,?,?)');
            stmt.run(Name,Name,DeviceType);
            stmt.finalize();
        }
        else if (element.PARENT != "" && !element.CHILDREN) {
            //this is a channel
            var Name = element.ADDRESS;
            var ChannelID = Name;
            var DeviceID = element.PARENT;

            stmt = db.prepare('REPLACE INTO CHANNELS (NAME, CHANNELID, DEVICEID) VALUES (?,?,?)');
            stmt.run(Name,Name,DeviceID);
            stmt.finalize();
        }
    }
    //list all devices
    db.each('SELECT COUNT(*) AS CNT FROM DEVICES', (err,rows) => {
        console.log('Devices: '+ rows.CNT);
    })
    db.each('SELECT COUNT(*) AS CNT FROM CHANNELS', (err,rows) => {
        console.log('Channels: '+ rows.CNT);
    })
    // register event now
    hm.registerEvent(handleEvent);
}

// register new Devices
hm.registerNewDevices( handleNewDevices );

//start the Server
console.log('Starting server');
hm.createServer('192.168.178.45','2001','192.168.178.36','1990');


// check db status
function checkCycle() {
    db.each('SELECT COUNT(*) AS CNT FROM ACTUAL_VALUES', (err,rows) => {
        //console.log('Measurements: '+ new Date().toISOString() + ' - '+ rows.CNT);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Measurements: '+ new Date().toLocaleTimeString('de-de') + ' - rows: '+ rows.CNT);
    })
} 
setInterval(checkCycle, 10000);