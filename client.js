// I'm the print client

var fs = require('fs')
var WebSocket = require('ws')
var websocket = require('websocket-stream')

function poll() {
  var ws = new WebSocket('ws://' + process.env.WS_HOST)
  var stream = websocket(ws)
  var tmpfile = './uploads/open_fd_do_not_modify.jpg'
  var outStream = fs.createWriteStream(tmpfile)
  outStream.on('error', function(err) { console.error('Error', err) })
  outStream.on('finish', function() {
    var newfile = './uploads/' + new Date().getTime() + '.jpg'
    fs.rename(tmpfile, newfile, function(err) {
      if (err) {
        return console.errror(err)
      }
      console.log('success!')
      //TODO: send to printer
      //TODO: after print delete file
      setTimeout(poll, 500)
    })
  })

  stream.pipe(outStream)

  ws.on('open', function() {
    console.log('ws open')
    ws.send(process.env.SECRET)
  })
}

  // var dirname = path.join(__dirname, 'uploads', req.url)
  // mkdirp(dirname, function(err) {
  //   if(err) return onError(err)
  //
  //   filename = filename.replace(/\s/g, '_')
  //   var p = path.join(dirname, new Date().getTime() + "_" + filename)
  //   var outStream = fs.createWriteStream(p)
  //
  //   outStream.on('error', onError)
  //   outStream.on('finish', onUploadSuccess)
  //
  //   file.pipe(outStream)
  //
  //   function onUploadSuccess() {
  //     console.log('saved file to', p)
  //     var cmd = "lp -d Canon_CP910 " + p
  //     exec(cmd, function (error, stdout, stderr) {
  //       if (stdout) sys.print('stdout: ' + stdout)
  //       if (stderr) sys.print('stderr: ' + stderr)
  //
  //       if (error !== null) {
  //         return onError(error)
  //       }
  //
  //       res.sendStatus(200)
  //     })
  //   }
  // })

poll()
