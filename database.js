var sqlite = require('sqlite3').verbose();

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

module.exports.handleNewDevices = function(err,params) {
    for (i=0; i<params[1].length; i++) {
        element = params[1][i];
        if (element.PARENT == "" && element.CHILDREN.length > 0)
        {
            //this is a device
            var Name = element.ADDRESS;
            var DeviceId = Name;
            var DeviceType = element.TYPE;

            stmt = db.prepare('INSERT OR IGNORE INTO DEVICES (NAME, DEVICEID, DEVICETYPE) VALUES (?,?,?)');
            stmt.run(Name,Name,DeviceType);
            stmt.finalize();
        }
        else if (element.PARENT != "" && !element.CHILDREN) {
            //this is a channel
            var Name = element.ADDRESS;
            var ChannelID = Name;
            var DeviceID = element.PARENT;

            stmt = db.prepare('INSERT OR IGNORE INTO CHANNELS (NAME, CHANNELID, DEVICEID) VALUES (?,?,?)');
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
    // hm.registerEvent(handleEvent);
}

module.exports.handleEvent = function(err,params) {  
    var Channel = params[1];
    var Measurement   = params[2];
    var dateTime = new Date().toISOString();
    var Value = params[3];

    stmt = db.prepare("INSERT INTO ACTUAL_VALUES (CHANNEL, MEASUREMENT, VALUE, TIME) VALUES (?,?,?,?)");
    stmt.run(Channel, Measurement, Value, dateTime);
    stmt.finalize();

}

module.exports.getChannels = function() {
    return new Promise((resolve,reject) => {
        var channels = [];
        stmt = db.all("SELECT NAME, CHANNELID, DEVICEID, ROWID FROM CHANNELS", (err, rows) => {
            if (err) {
                console.log(err);
                return reject(new Error("Error reading channel list from database"));
            }
            else{
                for (i=0; i<rows.length; i++) {
                    console.log(rows[i]);
                    channels.push({
                        id: rows[i].rowid, 
                        name: rows[i].NAME, 
                        channel: rows[i].CHANNELID, 
                        device: rows[i].DEVICEID
                    });
                }
                return resolve(channels);
            }
        });
    })
}

module.exports.getDevices = function() {
    return new Promise((resolve,reject) => {
        var devices = [];
        stmt = db.all("SELECT NAME, DEVICEID, DEVICETYPE, ROWID FROM DEVICES", (err, rows) => {
            if (err) {
                console.log(err);
                return reject(new Error("Error reading device list from database"));
            }
            else{
                for (i=0; i<rows.length; i++) {
                    devices.push({
                        id: rows[i].rowid, 
                        name: rows[i].NAME, 
                        device: rows[i].DEVICEID, 
                        type: rows[i].DEVICETYPE
                    });
                }
                return resolve(devices);
            }
        });
    })
}

module.exports.getDevice = function(deviceId) {
    return new Promise((resolve,reject) => {
        var device = {};
        stmt = db.get("SELECT NAME, DEVICEID, DEVICETYPE FROM DEVICES WHERE ROWID=?",deviceId, (err,devices) => {
            if (err) { 
                console.log("Error select from devices: " + err);
                return reject(new Error("Error reading device from devices"));
            }
            device.id = deviceId,
            device.name = devices.NAME;
            device.deviceid   = devices.DEVICEID;
            device.type = devices.DEVICETYPE;
            device.channels = [];
            stmt2 = db.all("SELECT NAME, CHANNELID, ROWID FROM CHANNELS WHERE DEVICEID=?",devices.DEVICEID, (err2,channels) => {
                if (err2) {
                    console.log("Error select from channels: " + err2);
                    return reject(new Error("Error reading channel list for device"));
                }
                for (i=0; i<channels.length; i++) {
                    var channel = {
                        id : channels[i].rowid,
                        name :  channels[i].NAME, 
                        channelid : channels[i].CHANNELID,
                        measurements : []
                    };
                    stmt3 = db.all("SELECT MEASUREMENT, COUNT(*) as CNT, ? AS CHANNELID FROM ACTUAL_VALUES WHERE CHANNEL=? GROUP BY MEASUREMENT",channels[i].CHANNELID, channels[i].CHANNELID, (err3,measurements) => {
                        if (err3) {
                            console.log("Error selecting distinct from actual_values: " + err3);
                            return reject(new Error("Error reading distinct measurements from actual values"));
                        }
                        console.log(measurements);
                        for (j=0; j<measurements.length; j++) {
                            var value = {
                                value: measurements[j].MEASUREMENT, 
                                count: measurements[j].CNT
                            };
                            //search right entry and add value to it
                            for (z=0; z<device.channels.length; z++) {
                                if (device.channels[z].channelid == measurements[j].CHANNELID) {
                                    device.channels[z].measurements.push(value);
                                }
                            }
                        }
                        if (i==channels.length) {
                            // now finished, return object
                            return resolve(device);
                        }
                    })
                    device.channels.push(channel);
                }
            })
        });

    })
}

module.exports.getDataFromChannel = function(channelID, measurement, tstart, tend) {
    return new Promise((resolve,reject) => {
        var data = {
            channel: channelID,
            measurement: measurement,
            from: tstart,
            to: tend,
            values : []
        };
        stmt = db.get("SELECT CHANNELID FROM CHANNELS where ROWID=?",channelID, (err,rows) => {
            if (err) {
                console.log(err);
                reject(new Error("Error reading channel"));
            }
            else if (!rows) {
                console.log('Nothing found for '+ channelID);
                reject(new Error("No data found for "+channelID));
            }
            else {
                channel = rows.CHANNELID;
                if (!tstart) {tstart='1970-01-01T00:00:00';}
                if (!tend) {tend='31.12.2100T00:00:00';}
                console.log('search for channel='+channel+' and measurement='+measurement + ' with Start='+tstart+' and end='+tend);
                stmt2 = db.all("SELECT VALUE, DATETIME(TIME) AS TIME FROM ACTUAL_VALUES WHERE CHANNEL=? AND MEASUREMENT=? AND TIME >= ? AND TIME <? ORDER BY TIME",channel, measurement, tstart, tend, (err2,datapoints) => {
                    if (err2) {
                        console.log(err2);
                        reject(new Error("Error reading values for channel " + channel));
                    }
                    else {
                        console.log(datapoints);
                        for (i=0; i<datapoints.length; i++) {
                            data.values.push( {
                                time: datapoints[i].TIME, 
                                value: datapoints[i].VALUE
                            });
                        }
                        return resolve(data);
                    }
                })
            }
        })
    })
}


/*
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
*/
