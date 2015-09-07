var input = document.querySelector('input[type=file]')
var filterHeight = 300

input.onchange = function () {
  var file = input.files[0]

  loadImage.parseMetaData(file, function (data) {
    var options = {canvas: true, maxHeight: window.innerHeight - filterHeight - 100, cover: true}

    if (data.exif) {
      options.orientation = data.exif.get('Orientation')
    }

    loadImage(file, function(img){
      var width = img.width
      var height = img.height

      if (img.width > window.innerWidth) {
        width = window.innerWidth
        height = window.innerWidth * img.height / img.width
      }

      var el = document.querySelector('#original')
      el.width = width
      el.height = height

      var ctx = el.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      drawFiltered(el, filterHeight)
    }, options)
  })
}

function drawFiltered(sourceCanvas, width) {
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
    ctx.clearRect(0, 0, width, width)
    ctx.drawImage(sourceCanvas, x, y, sourceWidth, sourceWidth, 0, 0, width, width)

    Caman("#" + el.id, function () {
      this.reloadCanvasData()
      this[el.id]()
      this.render()
    })
  })
}

