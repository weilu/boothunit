"use strict"

var fs = require("fs")
var path = require("path")
var mkdirp = require('mkdirp')
var express = require('express')
var busboy = require('connect-busboy')

var app = express()

app.use(busboy())

app.get('/*', function(req, res, next) {
  if (path.extname(req.url) == '') {
    req.originalUrl = '/'
    req.url = '/'
  }
  express.static(path.join(__dirname, 'app'))(req, res, next)
})

app.post('/*', function (req, res) {
  var dirname = path.join(__dirname, 'uploads', req.url)
  mkdirp(dirname, function() {
    var photoData = null
    var photoName = null
    req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
      switch(fieldname) {
        case "photo":
          photoData = new Buffer(val.replace(/^data:image\/\w+;base64,/, ""), 'base64')
          break
        case "name":
          photoName = val
          break
      }
    })

    req.busboy.on('finish', function() {
      var filename = path.join(dirname, photoName)
      console.log(filename)
      fs.writeFile(filename, photoData, function (err) {
        if (err) {
          console.log(err)
          //TODO: flash message
        }
        res.redirect("back")
      })
    })

    req.pipe(req.busboy)
  })
})

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Serving on http://%s:%s', host, port)
})

