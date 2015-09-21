"use strict"

var fs = require("fs")
var path = require("path")
var mkdirp = require('mkdirp')
var express = require('express')
var multer  = require('multer')
var upload = multer({ storage: multer.memoryStorage() })

var app = express()

app.use('/', express.static(path.join(__dirname, 'app')))
app.use('/timwei', express.static(path.join(__dirname, 'app')))

app.post('/*', upload.single('photo'), function (req, res) {
  console.log(req.file)
  mkdirp(__dirname + req.url, function() {
    var filename = __dirname + req.url + req.file.originalname
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

