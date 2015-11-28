// I'm the print client

var fs = require('fs')
var path = require('path')
var WebSocket = require('ws')
var exec = require('child_process').exec

function poll() {
  var ws = new WebSocket('ws://' + process.env.WS_HOST)

  ws.on('open', function() {
    console.log('ws open')
    ws.send(process.env.SECRET)
  })

  ws.on('message', function(url) {
    var filename = path.join(process.cwd(), 'uploads', decodeURIComponent(path.basename(url)))
    var cmd = `wget "${url}" -O "${filename}"`
    exec(cmd, function (error, stdout, stderr) {
      if (stdout) console.log('stdout: ' + stdout)
      if (stderr) console.error('stderr: ' + stderr)

      if (error) {
        return console.error(error)
      }

      console.log('saved file to', filename)

      // var cmd = "lp -d Canon_CP910 " + filename
      // exec(cmd, function (error, stdout, stderr) {
      //   if (stdout) console.log('stdout: ' + stdout)
      //   if (stderr) console.error('stderr: ' + stderr)
      //
      //   if (error) {
      //     return console.error(error)
      //   }
      // })

    })
  })
}

poll()
