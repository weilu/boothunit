var React = require('react')
var ReactDOM = require('react-dom')
var Masonry = require('react-masonry-component')(React)

var FILTER_HEIGHT = 300
var FILTERS = ["lomo", "clarity", "sunrise", "crossProcess", "jarques", "pinhole", "oldBoot", "glowingSun", "hazyDays", "concentrate"]

var BoothUnit = React.createClass({
  getInitialState: function() {
    return {
      preview: {}, originalBackup: {}, previewBackup: {},
      nextButtonEnabled: false,
      spinnerEnabled: false
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if(nextProps.img === this.props.img || !nextProps.img) return;

    var img = nextProps.img
    this.setState({
      img: img,
      preview: {
        width: nextProps.width,
        height: nextProps.height,
        img: img
      },
      originalBackup: {
        width: img.width,
        height: img.height,
        img: img,
        forceUpdate: 0
      },
      previewBackup: {
        width: nextProps.width,
        height: nextProps.height,
        img: img,
      },
      nextButtonEnabled: true
    })
  },
  render: function() {
    return (
      <div className={this.props.enabled ? "" : "hidden"}>
        <Navigation enabled={this.state.nextButtonEnabled} onSpinner={this.showSpinner}/>
        <div className="frame-main cater-frame-top cater-frame-bottom">
          <Canvas {...this.state.preview} className="original" />
          <FilterableCanvas {...this.state.originalBackup} className="hidden" id="upload" onApplyFilterDone={this.uploadAndPrint} />
          <FilterableCanvas {...this.state.previewBackup} className="hidden" id="tmp" onApplyFilterDone={this.updatePreview} forceUpdate='0' />
          <FilterList enabled={!this.state.spinnerEnabled} img={this.state.img} onApplyFilter={this.applyFilter}/>
          <Spinner enabled={this.state.spinnerEnabled} />
        </div>
      </div>
    )
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
  showSpinner: function() {
    var filter = this.filter
    if (!filter) { filter = 'original' }

    this.setState({
      spinnerEnabled: true,
      nextButtonEnabled: false,
      originalBackup: {
        filter: filter,
        forceUpdate: this.state.originalBackup.forceUpdate++
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
      self.setState({
        spinnerEnabled: false,
        nextButtonEnabled: true
      })
      if (this.status == 200) {
        self.props.onSuccess()
      } else {
        alert('Failed to upload photo. ' + this.status)
      }
    }
    xhr.send(formData)

    this.filter = null
  }
})

var FilterList = React.createClass({
  render: function() {
    var filterNodes = FILTERS.map(function(filter) {
      return (<Filter key={filter} id={filter} data={this.props.img} onApplyFilter={this.props.onApplyFilter} />)
    }, this)

    return (
      <div className={this.props.enabled ? "filters" : "filters hidden"}>
        {filterNodes}
      </div>
    )
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
    return (<canvas id={this.props.id} className={this.props.className} forceUpdate={this.props.forceUpdate}></canvas>)
  }
}

var Canvas = React.createClass({
  mixins: [CanvasMixin],
  onFilter: function() {}
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
  render: function() {
    return (
      <div className="btn btn-primary">
        <span>Get started</span>
        <input name="photo" type="file" accept="image/*" capture onChange={this.handleFileInput} />
      </div>
    )
  },
  handleFileInput: function(e) {
    var file = e.target.files[0]
    var self = this

    loadImage.parseMetaData(file, function (data) {
      var options = {
        canvas: true,
        cover: true,
        crop: true
      }

      var isLandscape;
      if (data.exif) {
        options.orientation = data.exif.get('Orientation')
        // Printouts must be 4x6 or 6x4, so check whether it's portrait or landscape. If anything fails or is undefined, or photo is a square, then this flag will be falsy and printout will default to portrait.
        isLandscape = parseInt(data.exif.get('PixelXDimension') || 0) > parseInt(data.exif.get('PixelYDimension') || 0);
      }

      // 1800 & 1200 because 6" x 4" x 300dpi
      if (isLandscape) {
        options.aspectRatio = 3/2
        options.maxWidth = 1800
        options.maxHeight = 1200
      } else {
        options.aspectRatio = 2/3
        options.maxWidth = 1200
        options.maxHeight = 1800
      }

      loadImage(file, function(img){

        var height = window.innerHeight - FILTER_HEIGHT - 100
        var width = 1.0 * img.width * height / img.height

        // shrink the image to fit viewport width
        if (width > window.innerWidth) {
          width = window.innerWidth
          height = window.innerWidth * img.height / img.width
        }

        self.props.onPreview(width, height, img)
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

var Spinner = React.createClass({
  render: function() {
    return (
      <div className={this.props.enabled ? "" : "hidden"}>
        <div id="spinner">
         <div className="rabbit"></div>
         <div className="clouds"></div>
        </div>
        <p className="words">Working on it...</p>
      </div>
    )
   }
})

var Navigation = React.createClass({
  render: function() {
    return (
      <div className="frame-top">
        <div className="action-bar">
          <div className="action-bar-element half-width">
            <a className="btn full-width" href="/">
              <i className="fa fa-camera"></i> Retake
            </a>
          </div>
          <div className="action-bar-element half-width">
            <a className="btn btn-clear full-width" href="#" onClick={this.next}>
            <i className="fa fa-print"></i> Print
            </a>
          </div>
        </div>
      </div>
    )
  },
  next: function() {
    if (this.props.enabled) { // prevent double upload
      this.props.onSpinner()
    }
  }
})

var Welcome = React.createClass({
  getInitialState: function() {
    return { photos: { keys: [] } }
  },
  componentDidMount: function() {
    this.loadGallery()
  },
  componentWillReceiveProps: function(newProps) {
    if (newProps.enabled && !this.props.enabled) {
      this.loadGallery()
    }
  },
  render: function() {
    var baseClassName = "welcome frame-main cater-frame-bottom text-center side-padder"
    var className = this.props.enabled ? baseClassName : baseClassName + " hidden"
    return (
      <div className={className}>
        <div id="flash" className={this.props.flashEnabled ? "" : "hidden"}>We have sent your photo to the printer. Go pick it up!</div>
        <i className="fa fa-camera-retro shady-logo"></i>
        <h1>Tonight's a Great&nbsp;Night!</h1>
        <p>Let's take a physical photo for you to keep!</p>
        <FileInput onPreview={this.props.onPreview} />

        <Gallery photos={this.state.photos}/>
      </div>
    )
  },
  loadGallery: function() {
    var self = this
    var xhr = new XMLHttpRequest()
    xhr.open('GET', "/photos.json", true)
    xhr.onload = function(e) {
      if (this.status == 200) {
        var photos = JSON.parse(this.responseText)
        self.setState({photos: photos})
      } else {
        alert('Failed to load gallery: ' + this.status)
      }
    }
    xhr.send()
  }
})

var App = React.createClass({
  getInitialState: function() {
    return {
      welcomeEnabled: true,
      flashEnabled: false
    }
  },
  render: function() {
    return (
    <div>
      <Welcome enabled={this.state.welcomeEnabled} flashEnabled={this.state.flashEnabled} onPreview={this.preview}/>
      <BoothUnit enabled={!this.state.welcomeEnabled} {...this.state.boothUnit} onSuccess={this.success}/>
    </div>
    )
  },
  preview: function(width, height, img) {
    this.setState({
      welcomeEnabled: false,
      boothUnit: {
        width: width,
        height: height,
        img: img
      }
    })
  },
  success: function() {
    this.setState({
      welcomeEnabled: true,
      flashEnabled: true,
      boothUnit: {}
    })
  }
})

var Gallery = React.createClass({
  render: function () {
    var urlPrefix = this.props.photos.prefix
    var childElements = this.props.photos.keys.reverse().map(function(filename){
      return (
        <div className="grid-item" key={filename}>
          <img src={urlPrefix + filename} />
        </div>
      )
    })
    var options = {
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      gutter: '.gutter-sizer',
      percentPosition: true
    }

    return (
      <Masonry className="gallery" options={options} >
        <div className="grid-sizer"></div>
        <div className="gutter-sizer"></div>
        {childElements}
      </Masonry>
    )
  }
})

ReactDOM.render(
  <App />,
  document.getElementById('content')
)
