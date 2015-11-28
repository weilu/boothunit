"use strict"

var fs = require("fs")
var path = require("path")
var sys = require('sys')
var exec = require('child_process').exec
var mkdirp = require('mkdirp')
var express = require('express')
var busboy = require('connect-busboy')
var WebSocketServer = require("ws").Server
var WebSocket = require('ws')
var AWS = require('aws-sdk')
var s3Stream = require('s3-upload-stream')(new AWS.S3())
var printClient = null
var counter = 0

var app = express()

app.use(busboy({immediate: true}))

app.get('/*', function(req, res, next) {
  if (path.extname(req.url) == '') {
    req.originalUrl = '/'
    req.url = '/'
  }
  express.static(path.join(__dirname, 'app'))(req, res, next)
})

app.post('/*', function (req, res) {
  req.busboy.on('file', function(filename, file) {
    var upload = s3Stream.upload({
      Bucket: "boothunit",
      ACL: "public-read",
      ContentType: "image/jpeg",
      Key: `${new Date().getTime()}_${counter++}.jpg`
    })

    upload.on('error', onError)

    // TODO: progress feedback
    upload.on('part', function (details) {
      console.log(details)
    })

    // success
    upload.on('uploaded', function (details) {
      console.log(details);
      // print
      if (printClient == null) {
        console.error('Are you sure the print client is running?')
        return res.sendStatus(500)
      }
      printClient.send(details.Location)
      // notify client
      res.sendStatus(200)
    })

    file.pipe(upload)
  })

  req.busboy.on('error', onError)

  function onError(err) {
    res.sendStatus(500)
    console.error(err)
  }
})

var server = app.listen(process.env.PORT || 8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Serving on http://%s:%s', host, port)
})

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {
  console.log("ws connection")

  ws.on("message", function(message) {
    if(message !== process.env.SECRET) { // poor man's auth
      console.log("invalid auth credentials")
      return ws.close()
    }

    printClient = ws
    printClient.on('error', function(err) { console.log(err) })
    printClient.on('finish', function() { console.log('success!') })
    console.log("printClient assigned")
  })

  ws.on("close", function() {
    console.log("ws close")
  })
})
