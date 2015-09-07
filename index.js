var input = document.querySelector('input[type=file]')

input.onchange = function () {
  var file = input.files[0]

  draw(file, document.querySelector('#original'), 600, 400)

  Array.prototype.forEach.call(document.querySelectorAll('.filter'), function(el) {
    draw(file, el, 300, 200, function() {
      Caman("#" + el.id, function () {
        this[el.id]()
        this.render()
      })
    })
  })
}

function draw(file, el, width, height, callback) {
  var reader = new FileReader();

  reader.onload = function (e) {
    var dataURL = e.target.result
    var ctx = el.getContext('2d')
    var img = new Image()

    img.onload = function() {
      if (img.width > img.height) {
        el.width = width
        el.height = height
      } else {
        el.width = height
        el.height = width
      }
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.drawImage(img, 0, 0, el.width, el.height)
    }

    img.src = dataURL

    if(callback) callback();
  }

  reader.readAsDataURL(file)
}
