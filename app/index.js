var FILTER_HEIGHT = 300

var input = document.querySelector('input[type=file]')
var dataEl = document.createElement('canvas')
var rawEl = document.createElement('canvas')
var displayEl = document.querySelector('#original')
var activeFilter = null

input.onchange = function () {
  var file = input.files[0]

  loadImage.parseMetaData(file, function (data) {
    var options = { canvas: true }
    if (data.exif) {
      options.orientation = data.exif.get('Orientation')
    }

    loadImage(file, function(img){
      img = loadImage.scale(img, { maxWidth: 1200, maxHeight: 1200 })

      var height = window.innerHeight - FILTER_HEIGHT - 100
      var width = 1.0 * img.width * height / img.height

      // shrink the image to fit viewport width
      if (width > window.innerWidth) {
        width = window.innerWidth
        height = window.innerWidth * img.height / img.width
      }

      displayEl.width = width
      displayEl.height = height

      var ctx = displayEl.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // back up the original photo for upload
      cloneCanvas(img, rawEl)
      // back up the downsized original photo for applying filters
      cloneCanvas(displayEl, dataEl)

      drawFilters(displayEl)

      show('input[type=submit]')
      hide('input[type=file]')
      watermark(displayEl)
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

    var ctx = rawEl.getContext('2d')
    ctx.font = "20px monospace"
    ctx.fillText("Tim & Wei's Wedding", rawEl.width - 310, rawEl.height - 86);
    ctx.fillText("2015-10-10", rawEl.width - 202, rawEl.height - 62);

    if (activeFilter == null) {
      uploadCanvasData(rawEl.toDataURL("image/jpeg"))
    } else {
      // re-apply current active filter on the original file to get best resolution
      var tmpSelector = "#upload"
      cloneCanvas(rawEl, document.querySelector(tmpSelector))
      Caman(tmpSelector, function() {
        this.reloadCanvasData()
        this[activeFilter]().render(function() {
          uploadCanvasData(this.toBase64("jpeg"))
          activeFilter = null // reset filter
        })
      })
    }

    return e.preventDefault()
  })
})

function hide(selector) {
  document.querySelector(selector).className = "hidden"
}

function show(selector) {
  document.querySelector(selector).className = ""
}

function uploadCanvasData(base64Data) {
  var xhr = new XMLHttpRequest()
  var formData = new FormData()
  var blob = dataURItoBlob(base64Data)
  formData.append(input.files[0].name, blob)
  xhr.open('POST', document.location.pathname, true)
  xhr.onload = function(e) {
    if (this.status == 200) {
      hide('input[type=submit]')
      hide('.filters')
      show('#flash')
    } else {
      alert('Failed to upload photo. ' + this.status)
    }
  }
  xhr.send(formData)
}

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
      activeFilter = filter
      watermark(displayEl)
    })
  })
}

function watermark(canvas) {
  var ctx = canvas.getContext('2d')
  ctx.font = "12px monospace"
  ctx.fillText("Tim & Wei's Wedding", canvas.width - 160, canvas.height - 28);
  ctx.fillText("2015-10-10", canvas.width - 95, canvas.height - 16);
}

function cloneCanvas(src, dest) {
  dest.width = src.width
  dest.height = src.height
  var destCxt = dest.getContext('2d')
  destCxt.drawImage(src, 0, 0)
}

function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var dw = new DataView(ab);
  for(var i = 0; i < byteString.length; i++) {
    dw.setUint8(i, byteString.charCodeAt(i));
  }

  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ab], {type: mimeString});
}
