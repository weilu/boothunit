"use strict"

var path = require("path")
var express = require('express')
var busboy = require('connect-busboy')
var WebSocketServer = require("ws").Server
var WebSocket = require('ws')
var AWS = require('aws-sdk')
var s3 = new AWS.S3()
var s3Stream = require('s3-upload-stream')(s3)
var printClient = null

var counter = 0
var BUCKET = "boothunit" //TODO: multi-tenant
var BUCKET_URL = "https://s3-ap-southeast-1.amazonaws.com/" + BUCKET + "/"

var app = express()

app.use(busboy({immediate: true}))

app.get('/photos.json', function(req, res, next) {
  var allKeys = []
  listAllKeys(null, function(err) {
    if(err) {
      return res.status(500).json(err)
    }
    res.json({ prefix: BUCKET_URL, keys: allKeys })
  })

  function listAllKeys(marker, cb) {
    s3.listObjects({Bucket: BUCKET, Marker: marker}, function(err, data) {
      if(err) return cb(err);

      allKeys = allKeys.concat(data.Contents.map(function(file) {
        return file.Key
      }))
      data.IsTruncated ? listAllKeys(data.NextMarker, cb) : cb()
    })
  }
})

app.get('/*', function(req, res, next) {
  if (path.extname(req.url) == '') {
    req.originalUrl = '/'
    req.url = '/'
  }
  express.static(path.join(__dirname, 'app'))(req, res, next)
})

app.post('/*', function (req, res) {
  var copies = parseInt(req.query.copies) || 1;
  console.log('Copies to print: '+copies);
  req.busboy.on('file', function(filename, file) {
    var upload = s3Stream.upload({
      Bucket: BUCKET,
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
      // TODO: notify print client of number of copies
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

    if (printClient) return; // client already assigned

    printClient = ws
    printClient.on('error', function(err) { console.log(err) })
    printClient.on('finish', function() { console.log('success!') })
    console.log("printClient assigned")
  })

  ws.on("close", function() {
    console.log("ws close")
  })
})
