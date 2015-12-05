// I'm the print client

var fs = require('fs')
var path = require('path')
var WebSocket = require('ws')
var exec = require('child_process').exec

var ws = new WebSocket('ws://' + process.env.WS_HOST)
var timeoutID = null

ws.on('open', function() {
  console.log('ws open')
  heartbeat()
})

ws.on('close', function() {
  console.log('server closed connection. Exiting')
  if(timeoutID) {
    clearTimeout(timeoutID)
  }
})

function heartbeat() {
  ws.send(process.env.SECRET)
  timeoutID = setTimeout(heartbeat, 1000 * 50) // heroku times out at 60 second
}

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

    if (process.env.DRYRUN) {
      return console.log('Dry run only. Not sending to printer')
    }

    var cmd = "lp -d Canon_CP910 " + filename
    exec(cmd, function (error, stdout, stderr) {
      if (stdout) console.log('stdout: ' + stdout)
      if (stderr) console.error('stderr: ' + stderr)

      if (error) {
        return console.error(error)
      }
    })
  })
})

