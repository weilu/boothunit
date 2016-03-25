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

ws.on('message', function(msg) {
  var payload = JSON.parse(msg)
  var filename = path.join(process.cwd(), 'uploads', decodeURIComponent(path.basename(payload.url)))
  var cmd = `wget "${payload.url}" -O "${filename}"`
  exec(cmd, function (error, stdout, stderr) {
    if (stdout) console.log('stdout: ' + stdout)
    if (stderr) console.error('stderr: ' + stderr)

    if (error) {
      return console.error(error)
    }

    console.log('saved file to', filename)

    var cmd = "lp -d Canon_CP910 " + filename + " -n " + payload.copies
    if (process.env.DRYRUN) {
      return console.log('Dry run only. Not sending to printer. cmd:', cmd)
    }

    exec(cmd, function (error, stdout, stderr) {
      if (stdout) console.log('stdout: ' + stdout)
      if (stderr) console.error('stderr: ' + stderr)

      if (error) {
        return console.error(error)
      }
    })
  })
})

