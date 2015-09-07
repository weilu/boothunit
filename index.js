var input = document.querySelector('input[type=file]')

input.onchange = function () {
  var file = input.files[0]

  loadImage.parseMetaData(file, function (data) {
    var options = {canvas: true, maxWidth: 600, minWidth: 600, cover: true}

    if (data.exif) {
      options.orientation = data.exif.get('Orientation')
    }

    loadImage(file, function(img){
      var el = document.querySelector('#original')
      el.width = img.width
      el.height = img.height

      var ctx = el.getContext('2d')
      ctx.drawImage(img, 0, 0)
      drawFiltered()
    }, options)
  })
}

function drawFiltered() {
  Array.prototype.forEach.call(document.querySelectorAll('.filter'), function(el) {
    var ctx = el.getContext('2d')
    var sourceCanvas = document.querySelector('#original')
    el.width = sourceCanvas.width / 2
    el.height = sourceCanvas.height / 2

    ctx.drawImage(sourceCanvas, 0, 0, el.width, el.height)

    Caman("#" + el.id, function () {
      this[el.id]().render()
    })
  })
}

