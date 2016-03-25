var React = require('react')
var ReactDOM = require('react-dom')
var Masonry = require('react-masonry-component')(React)

var FILTERS = ["lomo", "clarity", "sunrise", "crossProcess", "jarques", "pinhole", "oldBoot", "glowingSun", "hazyDays", "concentrate"]
var HEADER_HEIGHT = 52;

var BoothUnit = React.createClass({
  getInitialState: function() {
    return {
      preview: {}, originalBackup: {}, previewBackup: {},
      nextButtonEnabled: false,
      spinnerEnabled: false,
      filterHeight: 0.2 * window.innerHeight,
      previewHeight: 0
    }
  },
  componentDidMount: function() {
    window.addEventListener('resize', this.handleResize)
  },
  handleResize: function(e) {
    if (!this.state.img) return;
    var size = getPreviewSize(this.state.img)
    this.setState({filterHeight: 0.2 * window.innerHeight, previewHeight: size[1]})
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleResize);
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
      nextButtonEnabled: true,
      previewHeight: nextProps.height
    })
  },
  render: function() {
    return (
      <div className={this.props.enabled ? "" : "hidden"}>
        <Navigation enabled={this.state.nextButtonEnabled} onSpinner={this.showSpinner}/>
        <div className="frame-main cater-frame-top cater-frame-bottom">
          <Canvas {...this.state.preview} cssHeight={this.state.previewHeight} className="original" />
          <FilterableCanvas {...this.state.originalBackup} className="hidden" id="upload" onApplyFilterDone={this.uploadAndPrint} />
          <FilterableCanvas {...this.state.previewBackup} className="hidden" id="tmp" onApplyFilterDone={this.updatePreview} forceUpdate='0'/>
          <FilterList enabled={!this.state.spinnerEnabled} img={this.state.img} filterHeight={this.state.filterHeight} onApplyFilter={this.applyFilter}/>
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

    var copies = parseInt(prompt('How many copies? (Default 1, Max. 5)'));

    if (!copies) copies = 1;
    copies = Math.min(copies, 10); // Say the max is 5, but actually allow up to 10.
    copies = Math.max(copies, 1);

    var xhr = new XMLHttpRequest()
    var formData = new FormData()
    var blob = dataURItoBlob(base64Data)
    formData.append('photo.jpg', blob)
    formData.append('copies', copies)
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
      return (<Filter key={filter} id={filter} data={this.props.img} filterHeight={this.props.filterHeight} onApplyFilter={this.props.onApplyFilter} />)
    }, this)

    return (
      <div className={this.props.enabled ? "filters" : "filters hidden"}>
        {filterNodes}
      </div>
    )
  }
})

var Filter = React.createClass({
  getInitialState: function() {
    return { filterDrawn: false }
  },
  componentDidUpdate: function() {
    if (!this.props.data || this.state.filterDrawn) return

    var el = ReactDOM.findDOMNode(this)
    var ctx = el.getContext('2d')
    var width = this.props.filterHeight
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

    this.setState({filterDrawn: true})
  },
  render: function() {
    return (<canvas
              id={this.props.id}
              style={{height: this.props.filterHeight + "px", width: this.props.filterHeight + "px"}}
              onClick={this.onClick}
            ></canvas>)
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
    return (<canvas
              id={this.props.id}
              className={this.props.className}
              forceUpdate={this.props.forceUpdate}
              style={{height: this.props.cssHeight + "px"}}
            ></canvas>)
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
      var options = { canvas: true }
      if (data.exif) {
        options.orientation = data.exif.get('Orientation')
      }

      loadImage(file, function(img){
        var croppedHeight = img.height
        var croppedWidth = img.width
        var x = 0
        var y = 0
        // img.height = 1.0 * img.height // int to float
        if (img.height / img.width < 2/3) {
          croppedWidth = img.height * 3 / 2
        } else if (img.height / img.width < 1) {
          croppedHeight = img.width * 2 / 3
        } else if (img.height / img.width < 3/2) {
          croppedWidth = img.height * 2 / 3
        } else {
          croppedHeight = img.width * 3 / 2
        }
        x = (img.width - croppedWidth) / 2
        y = (img.height - croppedHeight) / 2

        // crop the original image to 2/3 or 3/2
        var croppedImg = document.createElement('canvas')
        croppedImg.width = croppedWidth
        croppedImg.height = croppedHeight
        var backCtx = croppedImg.getContext('2d')
        backCtx.drawImage(img, x, y, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight)
        croppedImg.className = 'hidden'
        document.body.appendChild(croppedImg)

        var size = getPreviewSize(croppedImg)
        self.props.onPreview(size[0], size[1], croppedImg)
      }, options)
    })
  }
})

function getPreviewSize(croppedImg) {
  var height = 0.8 * window.innerHeight - HEADER_HEIGHT
  var width = 1.0 * height * croppedImg.width / croppedImg.height
  if (width > window.innerWidth) { // shrink the image to fit viewport width
    width = window.innerWidth
    height = window.innerWidth * croppedImg.height / croppedImg.width
  }
  return [width, height]
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
