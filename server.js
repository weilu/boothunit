"use strict"

var fs = require("fs")
var path = require("path")
var mkdirp = require('mkdirp')
var express = require('express')
var busboy = require('connect-busboy')

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

  req.busboy.on('file', function(filename, file) {
    console.log('file', filename)
    var dirname = path.join(__dirname, 'uploads', req.url)
    mkdirp(dirname, function(err) {
      if(err) return onError(err)

      var p = path.join(dirname, filename)
      var outStream = fs.createWriteStream(p)

      outStream.on('error', onError)
      outStream.on('finish', function(){
        console.log('saved file to', p)
        res.sendStatus(200);
      })

      file.pipe(outStream)
    })
  })

  function onError(err) {
    res.sendStatus(500)
    console.log(err)
  }
})

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Serving on http://%s:%s', host, port)
})

