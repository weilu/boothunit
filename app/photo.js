var FILTER_HEIGHT = 300
var FILTERS = ["lomo", "clarity", "sunrise", "crossProcess", "jarques", "pinhole", "oldBoot", "glowingSun", "hazyDays", "concentrate"]

var BoothUnit = React.createClass({
  getInitialState: function() {
    return {
      preview: {}, originalBackup: {}, previewBackup: {},
      printButtonClassName: 'hidden',
      flashClassName: 'hidden',
      filtersClassName: 'filters'
    }
  },
  render: function() {
    var filterNodes = FILTERS.map(function(filter) {
      return (<Filter key={filter} id={filter} data={this.state.img} onApplyFilter={this.applyFilter} />)
    }, this)

    return (
      <div>
        <FileInput onPreview={this.preview} />
        <Canvas {...this.state.preview} className="original" />
        <FilterableCanvas {...this.state.originalBackup} className="hidden" id="upload" onApplyFilterDone={this.uploadAndPrint} />
        <FilterableCanvas {...this.state.previewBackup} className="hidden" id="tmp" onApplyFilterDone={this.updatePreview} />
        <button className={this.state.printButtonClassName} onClick={this.beforePrint}>print</button>
        <div id="flash" className={this.state.flashClassName}>We have sent your photo to the printer. Go pick it up!</div>
        <div className={this.state.filtersClassName}>
          {filterNodes}
        </div>
      </div>
    )
  },
  preview: function(width, height, img) {
    this.setState({
      img: img,
      preview: {
        width: width,
        height: height,
        img: img
      },
      originalBackup: {
        width: img.width,
        height: img.height,
        img: img
      },
      previewBackup: {
        width: width,
        height: height,
        img: img
      },
      printButtonClassName: ''
    })
  },
  applyFilter: function(filter) {
    this.filter = filter
    this.setState({
      previewBackup: {
        filter: filter
      }
    })
  },
  updatePreview: function(filteredImg) {
    var preview = Object.assign({}, this.state.preview)
    preview.img = filteredImg

    this.setState({
      preview: preview
    })
    //TODO: watermark
  },
  beforePrint: function() {
    var filter = this.filter
    if (!filter) {
      filter = 'original'
    }
    this.setState({
      originalBackup: {
        filter: filter
      }
    })
    //TODO: watermark
  },
  uploadAndPrint: function(filteredImg) {
    var self = this
    var base64Data = filteredImg.toDataURL("image/jpeg", 1)

    var xhr = new XMLHttpRequest()
    var formData = new FormData()
    var blob = dataURItoBlob(base64Data)
    formData.append('photo.jpg', blob)
    xhr.open('POST', document.location.pathname, true)
    xhr.onload = function(e) {
      if (this.status == 200) {
        self.setState({
          printButtonClassName: 'hidden',
          flashClassName: '',
          filtersClassName: 'filters hidden'
        })
      } else {
        alert('Failed to upload photo. ' + this.status)
      }
    }
    xhr.send(formData)

    this.filter = null
  }
})

var Filter = React.createClass({
  shouldComponentUpdate: function(props, state) {
    return this.props.data !== props.data
  },
  componentDidUpdate: function() {
    var el = ReactDOM.findDOMNode(this)
    var ctx = el.getContext('2d')
    var width = FILTER_HEIGHT
    el.width = width
    el.height = width

    var x, y, sourceWidth;
    var sourceCanvas = this.props.data
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
  },
  render: function() {
    return (<canvas id={this.props.id} onClick={this.onClick}></canvas>)
  },
  onClick: function() {
    this.props.onApplyFilter(this.props.id)
  }
})

var CanvasMixin = {
  componentDidUpdate: function() {
    var props = this.props
    if (props.filter) {
      this.onFilter()
    } else if (props.img) {
      var el = ReactDOM.findDOMNode(this)
      el.width = props.width
      el.height = props.height

      var context = el.getContext('2d')
      context.drawImage(props.img, 0, 0, props.width, props.height)
      context.save()
    }
  },
  render: function() {
    return (<canvas id={this.props.id} className={this.props.className}></canvas>)
  }
}

var Canvas = React.createClass({
  mixins: [CanvasMixin],
  onFilter: function() {
    //no-op
  }
})

var FilterableCanvas = React.createClass({
  mixins: [CanvasMixin],
  onFilter: function() {
    var props = this.props
    var self = this

    var el = ReactDOM.findDOMNode(this)
    if (props.filter === 'original') {
      return this.props.onApplyFilterDone(ReactDOM.findDOMNode(this))
    }

    var context = el.getContext('2d')
    context.restore()
    var selector = '#' + el.id
    Caman(selector, function() {
      this.reset()
      this[props.filter]().render(function() {
        self.props.onApplyFilterDone(document.querySelector(selector))
      })
    })
  },
  shouldComponentUpdate: function(props, state) {
    return (this.props.filter !== props.filter || props.img != null)
  }
})

var FileInput = React.createClass({
  getInitialState: function() {
    return {visibility: ''}
  },
  render: function() {
    return (
      <input
        name="photo" type="file" accept="image/*" capture
        onChange={this.handleFileInput}
        className={this.state.visibility}
      />
    )
  },
  handleFileInput: function(e) {
    var file = e.target.files[0]
    var self = this

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

        self.props.onPreview(width, height, img)
        self.setState({visibility: 'hidden'})
      }, options)
    })
  }
})

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

ReactDOM.render(
  <BoothUnit />,
  document.getElementById('content')
)

