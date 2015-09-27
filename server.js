"use strict"

var fs = require("fs")
var path = require("path")
var mkdirp = require('mkdirp')
var express = require('express')
var multer  = require('multer')
var upload = multer({ storage: multer.memoryStorage() })
var session = require('express-session')
var cookieParser = require('cookie-parser')
var flash = require('connect-flash')

var app = express()

app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(session({cookie: {maxAge: 60000}}))
app.use(flash())
app.set('view engine', 'jade')
app.set('views', './templates')

app.use('/', express.static(path.join(__dirname, 'app')))
app.get('/*', function(req, res, next) {
  console.log(req.flash('info'))
  res.render('index', { messages: req.flash('info') })
})

app.post('/*', upload.single('photo'), function (req, res) {
  var dirname = path.join(__dirname, 'uploads', req.url)
  mkdirp(dirname, function() {
    var filename = path.join(dirname, req.file.originalname)
    console.log(filename)
    fs.writeFile(filename, req.file.buffer, function (err) {
      if (err) {
        flash('error', 'Failed to upload. Try again.')
        console.log(err)
      }
      flash('info', 'Sent to print queue. Go pick it up!')
      res.redirect("back")
    })
  })
})

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Serving on http://%s:%s', host, port)
})

