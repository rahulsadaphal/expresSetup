// MYSQL Database file

const mysql = require("mysql");
const config = require("../../config");

const con = {
  host: config.databaseHost,
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseDatabaseName,
  connectionLimit: 300,
  multipleStatements: true
};

var pool = mysql.createPool(con);

module.exports = {
  query: function() {
    var sql_args = [];
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var callback = args[args.length - 1]; //last arg is callback
    pool.getConnection(function(err, connection) {
      // connection.on('error', error => {
      //   console.log('Error connecting to Database');
      //   console.log(error);
      // errorHandler(err);
      //   logger.error(error);
      //   return callback(error);
      // });
      if (err) {
        console.log("Error connecting to Database");
        console.log(err);
        // errorHandler(err);
        return callback(err);
      }
      console.log(
        "Connection established Successfully to [" +
          config.databaseHost +
          " DB :[" +
          config.databaseDatabaseName +
          "] ConId:" +
          connection.threadId
      );
      if (args.length > 2) {
        sql_args = args[1];
      }
      if (typeof args[0] == "object") {
        connection.query(args[0], function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if (err) {
            // logger.error(err);
            return callback(err);
          }
          callback(null, results);
        });
      } else {
        connection.query(args[0], sql_args, function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if (err) {
            // logger.error(err);
            return callback(err);
          }
          callback(null, results);
        });
      }
    });
  }
};

// con.connect(function(err) {
//   if (err) {
//     console.log(err);
//     console.log('Error connecting to Database');
//     return;
//   }
//   console.log('Connection established Successfully to [' + config.databaseHost + " DB : [" + config.databaseDatabaseName + "]" );
// });

// module.exports = con;
