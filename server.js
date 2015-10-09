"use strict"

var fs = require("fs")
var path = require("path")
var sys = require('sys')
var exec = require('child_process').exec
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
    var dirname = path.join(__dirname, 'uploads', req.url)
    mkdirp(dirname, function(err) {
      if(err) return onError(err)

      var p = path.join(dirname, new Date().getTime() + "_" + filename)
      var outStream = fs.createWriteStream(p)

      outStream.on('error', onError)
      outStream.on('finish', onUploadSuccess)

      file.pipe(outStream)

      function onUploadSuccess() {
        console.log('saved file to', p)
        var cmd = "lp -d Canon_CP910 " + p
        exec(cmd, function (error, stdout, stderr) {
          if (stdout) sys.print('stdout: ' + stdout)
          if (stderr) sys.print('stderr: ' + stderr)

          if (error !== null) {
            return onError(error)
          }

          res.sendStatus(200)
        })
      }
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

