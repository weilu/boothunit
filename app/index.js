var FILTER_HEIGHT = 300

var input = document.querySelector('input[type=file]')
var dataEl = document.createElement('canvas')
var displayEl = document.querySelector('#original')

input.onchange = function () {
  var file = input.files[0]

  loadImage.parseMetaData(file, function (data) {
    var options = {
      canvas: true,
      cover: true,
      maxHeight: window.innerHeight - FILTER_HEIGHT - 100
    }

    if (data.exif) {
      options.orientation = data.exif.get('Orientation')
    }

    loadImage(file, function(img){
      var width = img.width
      var height = img.height

      // shrink the image to fit viewport width
      if (img.width > window.innerWidth) {
        width = window.innerWidth
        height = window.innerWidth * img.height / img.width
      }

      displayEl.width = width
      displayEl.height = height

      var ctx = displayEl.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // back up the original data
      cloneCanvas(img, dataEl)

      drawFilters(displayEl)

    }, options)
  })
}

window.addEventListener('load', function(){
  var filters = document.querySelector('.filters')
  filters.addEventListener('click', function(e){
    if (e.target.id) applyFilter(e.target.id)
  }, false)

  var upload = document.querySelector('input[type=submit]')
  var name = document.querySelector('input[type=hidden]')
  upload.addEventListener('click', function(e) {
    if(input.files.length == 0) {
      alert("Please pick a photo or take a photo first")
      return e.preventDefault()
    }
    name.value = input.files[0].name
    input.type = 'text'
    input.value = displayEl.toDataURL()
  })
})

function drawFilters(sourceCanvas) {
  var width = FILTER_HEIGHT
  Array.prototype.forEach.call(document.querySelectorAll('.filters canvas'), function(el) {
    var ctx = el.getContext('2d')
    el.width = width
    el.height = width

    var x, y, sourceWidth;
    if (sourceCanvas.width > sourceCanvas.height) {
      x = (sourceCanvas.width - sourceCanvas.height ) / 2.0
      y = 0
      sourceWidth = sourceCanvas.height
    } else {
      x = 0
      y = (sourceCanvas.height - sourceCanvas.width ) / 2.0
      sourceWidth = sourceCanvas.width
    }
    ctx.drawImage(sourceCanvas, x, y, sourceWidth, sourceWidth, 0, 0, width, width)

    Caman("#" + el.id, function () {
      this.reloadCanvasData() // necessary if user replaces the current photo
      this[el.id]().render()
    })
  })
}

function applyFilter(filter) {
  var tmpSelector = "#tmp"
  cloneCanvas(dataEl, document.querySelector(tmpSelector))

  Caman(tmpSelector, function() {
    this.reset()
    this[filter]().render(function() {
      cloneCanvas(document.querySelector(tmpSelector), displayEl)
    })
  })
}

function cloneCanvas(src, dest) {
  dest.width = src.width
  dest.height = src.height
  var destCxt = dest.getContext('2d')
  destCxt.drawImage(src, 0, 0)
}

