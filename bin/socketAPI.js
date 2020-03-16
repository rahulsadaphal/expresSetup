var ss = require("socket.io-stream");
var path = require("path");
const logger1 = require("../logger");
// var socketAPI = require("../../bin/socketAPI");
var fs = require("fs");
var moment = require("moment");

const con = require("../modules/database/mysql");
const util = require("util");
const query = util.promisify(con.query).bind(con);

var socket_io = require("socket.io");
var socket_io = require("socket.io");
var io = socket_io();
var socketApi = {};

socketApi.io = io;
// let minerSocket = [];
// socketApi.minerSocket = minerSocket;

io.on("connection", async function(socket) {
  console.log("----------NEW MINER CONNECTED-------------", socket.id);
  logger1.info("----------NEW MINER CONNECTED-------------", socket.id);
  // console.log("Query: ", socket.handshake.query.MinerID);

  socket.on("hourlyAlive", async data => {
    let ts1 = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    var insertDailyLogQuery = `
        insert into tblDailyAliveLog (MinerID, Free_Space, Total_Space, CPU, GPU, RAM, SocketID, TimeStamp) 
        values (?,?,?,?,?,?,?,?)`;
    var insertDailyLogResult = await query(insertDailyLogQuery, [
      data.MinerID,
      data.free_space,
      data.total_space,
      JSON.stringify(data.CPU),
      JSON.stringify(data.GPU),
      JSON.stringify(data.RAM),
      socket.id,
      ts1
    ]);
  });

  socket.on("alive", async data => {
    //--------------INSERT TO DAILY MINER LOG---------------------

    // var ts = await query(`select current_timestamp() as ts`);
    // var timestamp1 = moment(ts[0].ts).format("YYYY-MM-DD HH:mm:ss");
    // var getTimeQuery = await query(
    //   "select TimeStamp from tblDailyAliveLog where MinerID = ? order by TimeStamp desc LIMIT 1",
    //   [data.MinerID]
    // );

    // if (getTimeQuery.length != 0) {
    //   var timestamp2 = moment(getTimeQuery[0].TimeStamp).format(
    //     "YYYY-MM-DD HH:mm:ss"
    //   );
    //   // var mins = moment
    //   //   .utc(moment(timestamp1).diff(moment(timestamp2)))
    //   //   .format("mm");
    //   var milisec = new Date(timestamp1) - new Date(timestamp2);
    //   var mins = Math.floor(milisec / 60000);
    //   if (mins > 59) {
    //     var insertDailyLogQuery = `
    //     insert into tblDailyAliveLog (MinerID, Free_Space, Total_Space, CPU, GPU, RAM, SocketID)
    //     values (?,?,?,?,?,?,?)`;
    //     var insertDailyLogResult = await query(insertDailyLogQuery, [
    //       data.MinerID,
    //       data.free_space,
    //       data.total_space,
    //       JSON.stringify(data.CPU),
    //       JSON.stringify(data.GPU),
    //       JSON.stringify(data.RAM),
    //       socket.id
    //     ]);
    //   }
    // }

    //-----------------------------------------------------------------------------------------------------------------
    var ts = await query(`select current_timestamp() as ts`);
    var timestamp = moment(ts[0].ts).format("YYYY-MM-DD HH:mm:ss");
    // var timestamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    const minerInsertQuery = `insert into minerlifelog (MinerID, IP_Address, Free_Space, Total_Space, CPU, GPU, RAM, SocketID, UpdatedOn) values (?,?,?,?,?,?,?,?,?)`;
    const minerSearchQuery =
      "select MinerID from minerlifelog where MinerID = ?";
    const minerUpdateQuery =
      "update minerlifelog set IP_Address = ?, Free_Space = ?, Total_Space = ?, CPU = ?, GPU = ?, RAM = ?, SocketID = ?, UpdatedOn = ? where MinerID = ?";
    try {
      console.log(
        "---------------INSIDE MINER ALIVE FUNCTION---------------------",
        data.MinerID
      );

      // console.log(socket.id, data.SocketID);
      const minerSearchResult = await query(minerSearchQuery, [data.MinerID]);

      if (minerSearchResult.length != 0) {
        const minerUpdateResult = await query(minerUpdateQuery, [
          data.network,
          data.free_space,
          data.total_space,
          JSON.stringify(data.CPU),
          JSON.stringify(data.GPU),
          JSON.stringify(data.RAM),
          socket.id,
          timestamp,
          data.MinerID
        ]);
      } else {
        const minerInsertResult = await query(minerInsertQuery, [
          data.MinerID,
          data.network,
          data.free_space,
          data.total_space,
          JSON.stringify(data.CPU),
          JSON.stringify(data.GPU),
          JSON.stringify(data.RAM),
          socket.id,
          timestamp
        ]);
      }
    } catch (error) {
      console.log(error);
      logger1.info(error);
    }
  });
});

socketApi.fileTransferNotification = async function(miner, fileName) {
  // io.sockets.emit("hello", { msg: "Hello World!" });
  // console.log("inside fileTransferNotification function", miner.SocketID, fileName.shard_GUID)
  const fileShardOwnerQuery = `insert into tblfilesshardowner (FileShardID, OwnerID) values (?,?)`;

  if (io.sockets.connected[miner.SocketID] != undefined) {
    const fileShardOwnerQResult = await query(fileShardOwnerQuery, [
      fileName.Id,
      miner.MinerID
    ]);
    //------------EMIT FILE SEND EVENT TO MINER----------------------
    io.to(miner.SocketID).emit("receiveData", fileName);
    return true;
  } else {
    return false;
  }
};

socketApi.fileReceiveferNotification = async function(minerAndShard) {
  //---------CHECK IF MINER IS CONNECTED OR NOT USING----------------
  if (io.sockets.connected[minerAndShard.SocketID] != undefined) {
    console.log("--------INSIDE GET DATA FROM MINER BLOCK----------");

    let status = getFileChunks(minerAndShard);
    if (status == "SUCCESS") {
      return minerAndShard.shard_GUID;
    }
    if (status == "FAIL") {
      return "ERROR";
    }
  }
  //------------ELSE MINER IS NOT CONNECTED, THEN GET FILE CHUNKS FROM BACKUP SERVER BY INVOKING FUNCTION AS BELOW
  else {
    console.log(
      "-------------INSIDE GET DATA FROM BACKUP SERVER BLOCK------------"
    );
    //--------HERE INVOKE A FN() TO GET DATA FROM BACKUP SERVER
  }
};

module.exports = socketApi;

function getFileChunks(minerAndShard) {
  //------------EMIT FILE GET EVENT TO MINER----------------------
  io.to(miner.SocketID).emit("getData", minerAndShard.shard_GUID);

  ss(io.sockets.socket).on("getFileChunk", function(stream, data) {
    var ws = fs.createWriteStream(
      process.cwd() + "/public/joinOutput" + filename
    );
    var filename = path.basename(data.name);
    stream.pipe(ws);
  });

  ws.on("finish", function() {
    console.log(
      "--------FILE SUCCESSFULLY DOWNLOADED TO /PUBLIC/JOINOUTPUT FOLDER-------"
    );
    return "SUCCESS";
  });

  ws.on("error", function() {
    console.log("--------ERROR IN FILE DOWNLOADING------------");
    return "FAIL";
  });
}

io.on("connection", function(socket) {
  console.log("A user connected");

  // return socket;
});

socketApi.sendNotification = function() {
  io.sockets.emit("hello", { msg: "Hello World!" });
};

module.exports = socketApi;
