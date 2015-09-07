var input = document.querySelector('input[type=file]')

input.onchange = function () {
  var file = input.files[0]

  drawOnCanvas(file)
}

function drawOnCanvas(file) {
  var reader = new FileReader();

  reader.onload = function (e) {
    var dataURL = e.target.result
    var c = document.querySelector('canvas')
    var ctx = c.getContext('2d')
    var img = new Image()

    img.onload = function() {
      c.width = img.width
      c.height = img.height
      ctx.drawImage(img, 0, 0)
    }

    img.src = dataURL
  }

  reader.readAsDataURL(file)
}

