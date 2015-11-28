// I'm the print client

var https = require('https')
var fs = require('fs')
var WebSocket = require('ws')

function poll() {
  var ws = new WebSocket('ws://' + process.env.WS_HOST)

  ws.on('open', function() {
    console.log('ws open')
    ws.send(process.env.SECRET)
  })

  ws.on('message', function(url) {
    //TODO: validate url
    var request = https.get(url, function(response) {

      var filename = 'uploads/' + url.substring(url.lastIndexOf('/') + 1)
      var outStream = fs.createWriteStream(filename)
      outStream.on('finish', function() {
        console.log('success!')
        //TODO: send to printer
        //TODO: after print delete file
        setTimeout(poll, 500)
      })
      outStream.on('error', function(err) {
        console.error(err)
      })

      response.pipe(outStream);

    }).on('error', function(e) {
      console.error(e)
    })
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
