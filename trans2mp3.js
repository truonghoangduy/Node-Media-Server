const express = require("express");

const app = express.Router();
const service = require("./ffmpeg.service");

app.get("/live/:key", (req, res) => {
  const { key } = req.params;

  console.log(key);

  let conn = service.instance().createAndGet(key);
  res.set("content-type", "audio/mp3");
  res.set("accept-ranges", "bytes");

  let started = false;
  let ffstream = conn.stream;

  ffstream.pipe(res);

  setTimeout(function () {
    if (!started) {
      console.log(`Connection timeout: ${conn.channel}`);
      service.instance().removeChannel(conn.channel);
      res.status(404).send({ message: "timeout" });
    }
  }, 5000);

  ffstream.on("open", function (commandLine) {
    console.log(`Start listening ${conn.channel}`);
    started = true;
  });

  conn.command.on("end", function (stdout, stderr) {
    service.instance().removeChannel(conn.channel);
    console.log(`Close Ended channel: ${conn.channel}`);
  });
  conn.command.on("error", function (err, stdout, stderr) {
    service.instance().removeChannel(conn.channel);
    console.log(`Close Error channel: ${conn.channel}`);
  });

  ffstream.on("close", function () {
    service.instance().removeChannel(conn.channel);
    console.log(`Close channel: ${conn.channel}`);
  });

  ffstream.on("error", function () {
    service.instance().removeChannel(conn.channel);
    console.log(`Error and remove channel: ${conn.channel}`);
  });
});

module.exports = app;