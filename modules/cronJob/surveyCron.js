var cron = require('cron').CronJob;
const con = require('../database/mysql');
const util = require('util');
const query = util.promisify(con.query).bind(con);

module.exports = cron;
/*
console.log("Started service for Survey ON/OFF on - " + new Date());
new cron('59 22 * * *', function () {
    Run();
}, null, true, 'America/Los_Angeles');


function Run() {
    
console.log("Called service for Survey ON/OFF on - " + new Date());
    const jsonResult = query("call auto_managesurvey()");
}
*/
