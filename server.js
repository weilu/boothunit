"use strict"

var fs = require("fs")
var path = require("path")
var mkdirp = require('mkdirp')
var express = require('express')
var multer  = require('multer')
var upload = multer({ storage: multer.memoryStorage() })

var app = express()

app.get('/*', function(req, res, next) {
  if (path.extname(req.url) == '') {
    req.originalUrl = '/'
    req.url = '/'
  }
  express.static(path.join(__dirname, 'app'))(req, res, next)
})

app.post('/*', upload.single('photo'), function (req, res) {
  var dirname = path.join(__dirname, 'uploads', req.url)
  mkdirp(dirname, function() {
    var filename = path.join(dirname, req.file.originalname)
    console.log(filename)
    fs.writeFile(filename, req.file.buffer, function (err) {
      if (err) {
        console.log(err)
      }
      res.redirect("back")
    })
  })
})

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Serving on http://%s:%s', host, port)
})

