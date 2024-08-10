import SioElement from "/sio/SioElement.js"

class BaseObject {
  constructor(options = {}) {
    this.active = false
    this.visible = false
    if (this.constructor.baseOptions) Object.assign(this, this.constructor.baseOptions)
    Object.assign(this, options)
  }
  render(ctx) {
    throw new Error("Method not implemented")
  }
}
class ImageObject extends BaseObject {
  static baseOptions = { img: null, x: 0, y: 0, width: "100%", height: "100%" }
  constructor(options) {
    super(options)
    this.loading = true
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.loadImage().then(() => this.loading = false)
  }
  render(ctx, canvas) {
    if (this.loading) return
    if (!this.visible) return
    let { img, x, y, width, height } = this
    if (width?.toString().endsWith("%")) width = canvas.width * parseFloat(width) / 100
    if (height?.toString().endsWith("%")) height = canvas.height * parseFloat(height) / 100
    if (x?.toString().endsWith("%")) x = canvas.width * parseFloat(x) / 100
    if (y?.toString().endsWith("%")) y = canvas.height * parseFloat(y) / 100
    const preserverCTX = ctx.save()
    ctx.drawImage(img, x, y, width, height)
    ctx.restore(preserverCTX)
  }
  loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = this.src
      img.onload = () => {
        this.img = img
        this.canvas.width = img.width
        this.canvas.height = img.height
        this.ctx.drawImage(img, 0, 0)
        resolve()
      }
    })
  }
}

class Layer {
  static baseOptions = { visible: true, opacity: 1 }
  constructor(options = {}) {
    if (this.constructor.baseOptions) Object.assign(this, this.constructor.baseOptions)
    Object.assign(this, options)
    this.objects = []
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: this.active
    })
  }
  render(ctx, canvas) {
    this.canvas.width = canvas.width
    this.canvas.height = canvas.height
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: this.active
    })
    this.ctx.imageSmoothingEnabled = true
    this.ctx.globalAlpha = this.opacity
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.objects.forEach(obj => obj.render(this.ctx, this.canvas))
    if (!this.visible) return
    if (!this.canvas.width || !this.canvas.height) return
    if (this.activeAddColor) {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const colors = this.activeAddColor.split(",").map(c => parseInt(c))
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] == 0) continue
        imageData.data[i] += colors[0] || 0
        imageData.data[i + 1] += colors[1] || 0
        imageData.data[i + 2] += colors[2] || 0
        imageData.data[i + 3] += colors[3] || 0
      }
      this.ctx.putImageData(imageData, 0, 0)
    }
    ctx.drawImage(this.canvas, 0, 0)
  }
  addObject(obj) {
    this.objects.push(obj)
  }
  checkCollision(x, y) {
    if (!this.active) return
    return this.ctx.getImageData(x, y, 1, 1).data[3] != 0
  }

  get active() {
    return this.objects.some(obj => obj.active)
  }
  set active(value) {
    return
  }
}
class Scene {
  constructor(name) {
    this.name = name
    this.layers = []
  }
  render(ctx, canvas) {
    this.layers.forEach(layer => {
      layer.render(ctx, canvas)
    })
  }
  addLayer(options) {
    const layer = new Layer(options)
    this.layers.push(layer)
    return layer
  }
  checkCollision(x, y) {
    this.layers.forEach(layer => {
      const collide = layer.checkCollision(x, y)

      if (collide) {
        console.log("Collide with", layer)
      }
    })
  }
  load(layers) {
    layers.forEach(layer => {
      const l = this.addLayer(layer)
      layer.objs.forEach(obj => {
        if (obj.type == "text") {
          l.addObject(this.addText(obj.data))
        }
        if (obj.type == "rect") {
          l.addObject(this.addRect(obj.data))
        }
        if (obj.type == "image") {
          const imageObject = new ImageObject(obj.data)
          l.addObject(imageObject)
        }
      })
    })
  }
}
class ShowRoom extends SioElement {
  static styles = `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: black;
      position: relative;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `
  constructor() {
    super()
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: true
    })
    // this.canvas.addEventListener("mousedown", e => this._onMouseDown(e))
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
    }
    this.objects = []
    this.scenes = []
    const resizeObserver = new ResizeObserver(() => this._onResize())
    resizeObserver.observe(this)
    this.deltaTime = 0
    this.lastTime = 0
    this.cameraTranslation = {
      x: 0,
      y: 0,
      z: 0
    }
    this.allowZoom = true
    this.allowPan = true
    this.renderZoom = true
    this.renderTravel = true
    this.moving = false
    this.startPoint = { x: 0, y: 0 }
    this.currentScene = 0
    document.addEventListener("keydown", e => {
      if (!this.allowPan) return
      if (["ARROWRIGHT", "D"].includes(e.key.toUpperCase())) this.cameraTranslation.x = -1
      if (["ARROWLEFT", "A"].includes(e.key.toUpperCase())) this.cameraTranslation.x = 1
      if (["ARROWUP", "W"].includes(e.key.toUpperCase())) this.cameraTranslation.y = 1
      if (["ARROWDOWN", "S"].includes(e.key.toUpperCase())) this.cameraTranslation.y = -1
      if (["Q"].includes(e.key.toUpperCase())) this.cameraTranslation.z = 1
      if (["E"].includes(e.key.toUpperCase())) this.cameraTranslation.z = -1
      if (e.shiftKey) {
        this.cameraTranslation.x *= 10
        this.cameraTranslation.y *= 10
      }
    })
    document.addEventListener("keyup", e => {
      if (!this.allowPan) return
      if (["ARROWRIGHT", "D", "ARROWLEFT", "A"].includes(e.key.toUpperCase())) this.cameraTranslation.x = 0
      if (["ARROWUP", "W", "ARROWDOWN", "S"].includes(e.key.toUpperCase())) this.cameraTranslation.y = 0
      if (["Q", "E"].includes(e.key.toUpperCase())) this.cameraTranslation.z = 0
    })
    this.addEventListener("wheel", e => {
      if (!this.allowZoom) return
      const deltaZoom = e.deltaY * -0.001
      this.zoom(deltaZoom)
    })
    this.addEventListener("mousedown", e => {
      this.moving = true
      this.checkCollision(e.offsetX, e.offsetY)
      this.startPoint = { x: e.offsetX, y: e.offsetY }
    })
    this.addEventListener("mouseup", e => {
      this.moving = false
      if (this.startPoint.x == e.offsetX && this.startPoint.y == e.offsetY) {
        const collisionElement = this._getCollisionElement(e.offsetX, e.offsetY)
        if (collisionElement) {
          console.log("Clicked on", collisionElement)
        }
      }
    })
    this.addEventListener("mousemove", e => {
      if (this.moving) {
        this.camera.x += e.movementX
        this.camera.y += e.movementY
        return
      }
      this.checkCollision(e.offsetX, e.offsetY)
    })
    this.addEventListener("touchstart", e => {
      this.moving = true
      this.checkCollision(e.touches[0].clientX, e.touches[0].clientY)
      this.startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    })
    this.addEventListener("touchend", e => {
      this.moving = false
      if (this.startPoint.x == e.changedTouches[0].clientX && this.startPoint.y == e.changedTouches[0].clientY) {
        const collisionElement = this._getCollisionElement(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        if (collisionElement) {
          console.log("Clicked on", collisionElement)
        }
      }
    })
    this.addEventListener("touchmove", e => {
      if (this.moving) {
        this.camera.x += e.touches[0].clientX - this.startPoint.x
        this.camera.y += e.touches[0].clientY - this.startPoint.y
        this.startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        return
      }
      this.checkCollision(e.touches[0].clientX, e.touches[0].clientY)
    })
  }
  _getCollisionElement(x, y) {
    const actives = this.objects.filter(obj => obj.active)
    const wpxWithoutZoom = x - this.camera.x
    const wpyWithourZoom = y - this.camera.y
    const wpx = parseInt(wpxWithoutZoom / this.camera.zoom)
    const wpy = parseInt(wpyWithourZoom / this.camera.zoom)
    for (const active of actives) {
      active.visible = false
      const isActive = active.ctx.getImageData(wpx, wpy, 1, 1).data[3] != 0
      if (isActive) {
        return active
      }
    }
    return null
  }
  checkCollision(x, y) {
    const activeScene = this.scenes[this.currentScene]
    activeScene.checkCollision(x, y)
    const actives = this.objects.filter(obj => obj.active)
    const collisionElement = this._getCollisionElement(x, y)
    for (const active of actives) {
      active.visible = false
    }
    if (collisionElement) {
      collisionElement.visible = true
    }
  }
  zoom(value) {
    this.camera.zoom = Math.min(Math.max(value, 1), 2)
    this.requestUpdate()
  }
  _onResize() {
    const computedStyle = getComputedStyle(this)
    const width = parseInt(computedStyle.width)
    const height = parseInt(computedStyle.height)
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext("2d")
    this.ctx.imageSmoothingEnabled = false
  }
  _draw() {
    this.ctx.clearRect(-100, -100, this.canvas.width + 500, this.canvas.height + 500)
    this.ctx.imageSmoothingEnabled = true
    this.scenes[this.currentScene].render(this.ctx, this.canvas)
    this._applyCamera()
  }
  _applyCamera() {
    this.camera.x += this.cameraTranslation.x * this.canvas.width / 10 * this.deltaTime
    this.camera.y += this.cameraTranslation.y * this.canvas.height / 10 * this.deltaTime
    this.camera.zoom += this.cameraTranslation.z * this.deltaTime
    if (this.camera.x > 0) this.camera.x = 0
    if (this.camera.y > 0) this.camera.y = 0
    if (this.camera.x < this.canvas.width - this.canvas.width * this.camera.zoom) this.camera.x = this.canvas.width - this.canvas.width * this.camera.zoom
    if (this.camera.y < this.canvas.height - this.canvas.height * this.camera.zoom) this.camera.y = this.canvas.height - this.canvas.height * this.camera.zoom
    this.ctx.resetTransform()
    this.ctx.translate(this.camera.x, this.camera.y)
    if (!this.canvas.width || !this.canvas.height) return
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.scale(this.camera.zoom, this.camera.zoom)
    if (!imageData.width || !imageData.height) return
    this.ctx.putImageData(imageData, 0, 0)
  }
  animate() {
    if (!this.lastTime) this.lastTime = Date.now()
    const currentTime = Date.now()
    this.deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this._draw()
    requestAnimationFrame(() => this.animate())
  }
  cameraTo(x, y) {
    if (x.toString().endsWith("%")) x = this.canvas.width * this.camera.zoom * parseFloat(x) / 100
    if (y.toString().endsWith("%")) y = this.canvas.height * this.camera.zoom * parseFloat(y) / 100
    this.camera.x = x
    this.camera.y = y
  }
  load(lb64) {
    const data = JSON.parse(atob(lb64))
    if (!data.scenes) return
    if (!data.scenes[0]) return
    const currentScene = 0
    for (let scene of data.scenes) {
      const sceneObj = new Scene(scene.name)
      sceneObj.load(scene.layers)
      this.scenes.push(sceneObj)
    }
  }
  firstRendered() {
    this.camera.zoom = 1.5
    this.cameraTo("50%", "50%")
    this.animate()
  }
  _renderZoomControls() {
    if (this.renderZoom) {
      const zoomedIn = this.camera.zoom == 2
      const zoomedOut = this.camera.zoom == 1
      const zoomReseted = this.camera.zoom == 1.5
      const zoomInControl = !zoomedIn ? this.html`<button @click=${() => this.zoom(2)}>Zoom In</button>` : ""
      const zoomOutControl = !zoomedOut ? this.html`<button @click=${() => this.zoom(1)}>Zoom Out</button>` : ""
      const zoomResetControl = !zoomReseted ? this.html`<button @click=${() => this.zoom(1.5)}>Reset Zoom</button>` : ""

      return this.html`
        <div style="position: absolute; bottom: 10px; right: 10px; display: flex; flex-direction: column; gap: 10px;">
          ${zoomInControl}
          ${zoomOutControl}
          ${zoomResetControl}
        </div>
      `
    }
  }
  _renderTravelControls() {
    return this.html`
      <div style="position: absolute; bottom: 10px; left: 10px; display: flex; flex-direction: column; gap: 10px;">
        <button @mousedown=${() => this.cameraTranslation.x = 1} @mouseup=${() => this.cameraTranslation.x = 0}>Left</button>
        <button @mousedown=${() => this.cameraTranslation.x = -1} @mouseup=${() => this.cameraTranslation.x = 0}>Right</button>
        <button @mousedown=${() => this.cameraTranslation.y = 1} @mouseup=${() => this.cameraTranslation.y = 0}>Up</button>
        <button @mousedown=${() => this.cameraTranslation.y = -1} @mouseup=${() => this.cameraTranslation.y = 0}>Down</button>
      </div>
    `
  }
  render() {
    const zoom = this.renderZoom ? this._renderZoomControls() : ""
    const travel = this.renderTravel ? this._renderTravelControls() : ""
    return this.html`
      ${this.canvas}
      ${zoom}
      ${travel}
    `
  }
}
ShowRoom.define("show-room")
export default ShowRoom