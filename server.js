"use strict"

var fs = require("fs")
var path = require("path")
var sys = require('sys')
var exec = require('child_process').exec
var mkdirp = require('mkdirp')
var express = require('express')
var busboy = require('connect-busboy')
var WebSocketServer = require("ws").Server
var websocket = require('websocket-stream')
var printClient = null

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

  req.busboy.on('error', onError)
  // TODO: upload to s3
  req.busboy.on('file', function(filename, file) {
    file.pipe(printClient)
  })

  function onError(err) {
    res.sendStatus(500)
    console.log(err)
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
    console.log("ws message")
    if(message !== process.env.SECRET) { // poor man's auth
      return ws.close()
    }

    printClient = websocket(ws)
    printClient.on('error', function(err) { console.log(err) })
    printClient.on('finish', function() { console.log('success!') })
    console.log("printClient assigned")
  })

  ws.on("close", function() {
    console.log("ws close")
  })
})
