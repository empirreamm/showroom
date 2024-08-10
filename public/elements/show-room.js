import SioElement from "../sio/SioElement.js"
import "./sio-dialog.js"
import "./sio-carrousel.js"
const hexToRgb = hex => {
  const bigint = parseInt(hex.replace("#", ""), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

const areaSVG = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#383a3d"><path d="M200-160v-366L88-440l-48-64 440-336 160 122v-82h120v174l160 122-48 64-112-86v366H520v-240h-80v240H200Zm80-80h80v-240h240v240h80v-347L480-739 280-587v347Zm120-319h160q0-32-24-52.5T480-632q-32 0-56 20.5T400-559Zm-40 319v-240h240v240-240H360v240Z"/></svg>')
const bedSVG = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#383a3d"><path d="M200-200h-40l-26-80H80v-201q0-33 23.5-56t56.5-23v-120q0-33 23.5-56.5T240-760h480q33 0 56.5 23.5T800-680v120q33 0 56.5 23.5T880-480v200h-54l-26 80h-40l-26-80H226l-26 80Zm320-360h200v-120H520v120Zm-280 0h200v-120H240v120Zm-80 200h640v-120H160v120Zm640 0H160h640Z"/></svg>')
const bathSVG = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#383a3d"><path d="M280-600q-33 0-56.5-23.5T200-680q0-33 23.5-56.5T280-760q33 0 56.5 23.5T360-680q0 33-23.5 56.5T280-600ZM200-80q-17 0-28.5-11.5T160-120q-33 0-56.5-23.5T80-200v-240h120v-30q0-38 26-64t64-26q20 0 37 8t31 22l56 62q8 8 15.5 15t16.5 13h274v-326q0-14-10-24t-24-10q-6 0-11.5 2.5T664-790l-50 50q5 17 2 33.5T604-676L494-788q14-9 30-11.5t32 3.5l50-50q16-16 36.5-25t43.5-9q48 0 81 33t33 81v326h80v240q0 33-23.5 56.5T800-120q0 17-11.5 28.5T760-80H200Zm-40-120h640v-160H160v160Zm0 0h640-640Z"/></svg>')
const carSVG = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#383a3d"><path d="M240-200v40q0 17-11.5 28.5T200-120h-40q-17 0-28.5-11.5T120-160v-320l84-240q6-18 21.5-29t34.5-11h440q19 0 34.5 11t21.5 29l84 240v320q0 17-11.5 28.5T800-120h-40q-17 0-28.5-11.5T720-160v-40H240Zm-8-360h496l-42-120H274l-42 120Zm-32 80v200-200Zm100 160q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Zm-460 40h560v-200H200v200Z"/></svg>')

class Layer {
  static baseOptions = { visible: true, opacity: 1, color: "#000000" }
  constructor(options = {}) {
    if (this.constructor.baseOptions) Object.assign(this, this.constructor.baseOptions)
    Object.assign(this, options)
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d", {
      willReadFrequently: this.active
    })
    if (!this.image) return
    this.renderCanvas = null
    this.darkenCanvas = null
    const img = new Image()
    img.src = this.image
    img.onload = () => {
      this.image = img
      this.canvas.width = img.width
      this.canvas.height = img.height
      this.ctx.drawImage(img, 0, 0)
      this.addColorData()
    }
    this.colorData = hexToRgb(this.color)
    this.originalVisible = this.visible
    this.originalOpacity = this.opacity
    this.listeners = {}
    this.infoDiv = null
    this.infoDialog = null

    this.displayDarken = false
    this.createInfoDiv()
    this.createInfoDialog()

  }
  addColorData() {
    const renderCanvas = document.createElement("canvas")
    const darkenCanvas = document.createElement("canvas")
    renderCanvas.width = this.canvas.width
    renderCanvas.height = this.canvas.height
    darkenCanvas.width = this.canvas.width
    darkenCanvas.height = this.canvas.height
    const renderCtx = renderCanvas.getContext("2d")
    const darkenCtx = darkenCanvas.getContext("2d")
    const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const darkenData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const pixels = data.data
    const darkenPixels = darkenData.data

    const missingOpacity = 1 - parseFloat(this.originalOpacity)
    const darkenOpacity = parseFloat(this.originalOpacity) + missingOpacity * .5
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] == 0) continue
      pixels[i] = pixels[i] + this.colorData.r
      pixels[i + 1] = pixels[i + 1] + this.colorData.g
      pixels[i + 2] = pixels[i + 2] + this.colorData.b
      pixels[i + 3] = pixels[i + 3] * this.opacity

      darkenPixels[i] = this.colorData.r
      darkenPixels[i + 1] = this.colorData.g
      darkenPixels[i + 2] = this.colorData.b
      darkenPixels[i + 3] = darkenOpacity * 255
    }
    renderCtx.putImageData(data, 0, 0)
    darkenCtx.putImageData(darkenData, 0, 0)
    this.renderCanvas = renderCanvas
    this.darkenCanvas = darkenCanvas
  }
  createInfoDiv() {
    const div = document.createElement("div")
    div.style.position = "absolute"
    div.style.top = "0"
    div.style.left = "50%"
    div.style.transform = "translateX(-50%)"
    div.style.backgroundColor = "white"
    div.style.display = "grid"
    div.style.gridTemplateColumns = "auto 1fr"
    div.style.padding = "2px"
    const nameDiv = document.createElement("div")
    nameDiv.textContent = this.name
    nameDiv.style.backgroundColor = this.color
    nameDiv.style.fontWeight = "bold"
    nameDiv.style.textAlign = "center"
    nameDiv.style.color = "white"
    nameDiv.style.padding = "12px"
    const infoDiv = document.createElement("div")
    infoDiv.textContent = this.extra
    infoDiv.style.padding = "12px"
    infoDiv.style.fontWeight = "bold"
    infoDiv.style.textAlign = "center"
    div.appendChild(nameDiv)
    div.appendChild(infoDiv)
    this.infoDiv = div
  }
  createInfoDialog() {
    const dialog = document.createElement("sio-dialog")
    dialog.style.borderRadius = "8px"
    dialog.classList.add("infoDialog")
    dialog.setAttribute("prevent-backdrop", true)
    dialog.preventBackdrop = true
    if (!document.head.querySelector(".dialogStyle")) {
      const style = document.createElement("style")
      style.innerHTML = `
        .infoDialog{
          background-attachment: scroll;
          background-clip: border-box;
          background-color: rgb(255, 255, 255);
          background-image: none;
          background-origin: padding-box;
          background-position-x: 0%;
          background-position-y: 0%;
          background-repeat: repeat;
          background-size: auto;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          box-shadow: rgba(0, 0, 0, 0.25) 0px 8px 16px 0px;
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          display: block;
          font-family: Gotham, sans-serif;
          font-size: 16px;
          font-weight: 400;
          height: 534px;
          left: 0px;
          line-height: 25.6px;
          margin-bottom: 16px;
          max-width: 90%;
          overflow-y: auto;
          position: relative;
          right: 0px;
          top: 0px;
          width: 600px;
        }
      `
      style.classList.add("dialogStyle")
      document.head.appendChild(style)
    }
    const price = this.infoDiv_price ? parseFloat(this.infoDiv_price).toLocaleString('es-MX',
      {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        thousandSeparator: true
      }
    ) : "Consultar precio"
    const carrousel = this.infoDiv_images ? `<sio-carrousel stringdata=${this.infoDiv_images}></sio-carrousel>` : ""
    const options = this.infoDiv_links?.split("|").map(
      link => {
        const [text, url, color] = link.split("<>")
        const backgroundColor = color == "primary" ? "#fff" : color == "secondary" ? "rgb(153, 192, 140)" : "#00f0"
        const colorText = color == "secondary" ? "#fff" : "#000"
        const border = color == "primary" ? "1px solid #000" : "0px!important"
        const padding = !["primary", "secondary"].includes(color) ? "0px!important" : "8px"
        const boxshadow = !["primary", "secondary"].includes(color) ? "0px 0px 0px 0px!important" : "auto"
        const margin = !["primary", "secondary"].includes(color) ? "0px!important" : "auto"
        const textDecoration = !["primary", "secondary"].includes(color) ? "underline" : "none"
        return `<a href="${url}" class="option" style="background-color: ${backgroundColor}; color: ${colorText}; border: ${border}; padding:${padding}; box-shadow:${boxshadow};margin:${margin};text-decoration:${textDecoration};">${text}</a>`
      }
    ).join("") || ""
    dialog.innerHTML = `
      <style>
        .content_${this.id} {
          width: 80vw;
          max-width: 600px;
          max-height: 80vh;
          display:grid;
          grid-template-rows: auto auto 1fr auto;
          border-radius: 8px;
          padding-bottom: 16px;
        }
        .content_${this.id} .status{
          background-attachment: scroll;
          background-clip: border-box;
          background-color: ${this.color};
          background-image: none;
          background-origin: :padding-box;
          background-position-x: 0%;
          background-position-y: 0%;
          background-repeat: repeat;
          background-size: auto;
          border-bottom-left-radius: 0px;
          border-bottom-right-radius: 8px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          box-sizing: border-box;
          color: rgb(255, 255, 255);
          display: block;
          font-family: Gotham, sans-serif;
          font-size: 12px;
          font-weight: 400;
          height: 28px;
          line-height: 12px;
          margin-bottom: 0px;
          margin-left: 0px;
          margin-right: 0px;
          margin-top: 0px;
          padding-bottom: 8px;
          padding-left: 16px;
          padding-right: 16px;
          padding-top: 8px;
          unicode-bidi: isolate;
          width: 95.0156px;
        }
        .content_${this.id} .infoSegment{
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .content_${this.id} .price{
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          display: inline;
          font-family: Gotham, sans-serif;
          font-size: 16px;
          font-weight: 700;
          height: auto;
          line-height: 25.6px;
          width: auto;
        }
        .content_${this.id} .iconsSegment{
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .content_${this.id} .icon{
          align-items: center;
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          display: flex;
          font-family: Gotham, sans-serif;
          font-size: 12px;
          font-weight: 400;
          height: 32px;
          line-height: 19.2px;
          margin-bottom: 0px;
          margin-left: 0px;
          margin-right: 0px;
          margin-top: 0px;
          width: 61.0625px;
          -webkit-box-align: center;
        }
        .content_${this.id} .optionsSegment{
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 12px;
        }
        .content_${this.id} .close-container{
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }
        .content_${this.id} .close{
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          cursor: pointer;
          display: flex;
          fill: none;
          flex-shrink: 0;
          font-family: Gotham, sans-serif;
          font-feature-settings: normal;
          font-kerning: auto;
          font-optical-sizing: auto;
          font-size: 16px;
          font-size-adjust: none;
          font-stretch: 100%;
          font-style: normal;
          font-variant-alternates: normal;
          font-variant-caps: normal;
          font-variant-east-asian: normal;
          font-variant-ligatures: normal;
          font-variant-numeric: normal;
          font-variant-position: normal;
          font-variation-settings: normal;
          font-weight: 400;
          height: 32px;
          letter-spacing: normal;
          line-height: 25.6px;
          margin-inline-start: 0px;
          overflow-clip-margin: content-box;
          overflow-x: hidden;
          overflow-y: hidden;
          pointer-events: auto;
          text-align: center;
          text-indent: 0px;
          text-rendering: auto;
          text-shadow: none;
          text-transform: none;
          width: 10px;
          word-spacing: 0px;
          cursor: pointer;
        }
        .content_${this.id} .close:hover .icon{
          stroke: red;
          color: red;
        }
        .content_${this.id} h3{
          color: rgb(54, 54, 54);
          box-sizing: border-box;
          display: block;
          font-family: Gotham, sans-serif;
          font-size: 28px;
          font-weight: 900;
          height: 35px;
          line-height: 35px;
          margin-block-end: 16px;
          margin-block-start: 0px;
          margin-bottom: 16px;
          margin-inline-end: 0px;
          margin-inline-start: 0px;
          margin-left: 0px;
          margin-right: 0px;
          margin-top: 0px;
          unicode-bidi: isolate;
        }
        .content_${this.id} .description{
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          display: block;
          font-family: Gotham, sans-serif;
          font-size: 16px;
          font-weight: 400;
          height: 25.5938px;
          line-height: 25.6px;
          margin-bottom: 0px;
          margin-top: 0px;
          unicode-bidi: isolate;
          width: 256px;
        }
        .content_${this.id} .carrouselSegment{
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          display: flex;
          font-family: Gotham, sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: 25.6px;
          margin-block-start: 16px;
          width: 583px;
        }
        .content_${this.id} .optionsSegment{
          margin-bottom: 16px;
          margin-top: 16px;
          padding-bottom: 16px;
        }
        .content_${this.id} .optionsSegment .option{
          align-items: center;
          appearance: auto;
          background-attachment: scroll;
          background-clip: border-box;
          background-color: rgba(0, 0, 0, 0);
          background-image: none;
          background-origin: padding-box;
          background-position-x: 0%;
          background-position-y: 0%;
          background-repeat: repeat;
          background-size: auto;
          border-bottom-color: rgb(27, 43, 72);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-bottom-style: solid;
          border-bottom-width: 2px;
          border-image-outset: 0;
          border-image-repeat: stretch;
          border-image-slice: 100%;
          border-image-source: none;
          border-image-width: 1;
          border-left-color: rgb(27, 43, 72);
          border-left-style: solid;
          border-left-width: 2px;
          border-right-color: rgb(27, 43, 72);
          border-right-style: solid;
          border-right-width: 2px;
          border-top-color: rgb(27, 43, 72);
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-top-style: solid;
          border-top-width: 2px;
          box-shadow: rgba(0, 0, 0, 0.7) 0px 14px 14px -14px;
          box-sizing: border-box;
          color: rgb(54, 54, 54);
          cursor: pointer;
          display: flex;
          filter: brightness(1.1);
          font-family: Gotham, sans-serif;
          font-feature-settings: normal;
          font-kerning: auto;
          font-optical-sizing: auto;
          font-size: 14px;
          font-size-adjust: none;
          font-stretch: 100%;
          font-style: normal;
          font-variant-alternates: normal;
          font-variant-caps: normal;
          font-variant-east-asian: normal;
          font-variant-ligatures: normal;
          font-variant-numeric: normal;
          font-variant-position: normal;
          font-variation-settings: normal;
          font-weight: 400;
          height: 58px;
          justify-content: center;
          letter-spacing: normal;
          line-height: normal;
          margin-block-end: 16px;
          margin-bottom: 16px;
          margin-inline-end: 16px;
          margin-inline-start: 0px;
          margin-left: 0px;
          margin-right: 16px;
          margin-top: 0px;
          max-width: none;
          min-height: 58px;
          min-width: 192px;
          pointer-events: auto;
          position: relative;
          text-align: center;
          text-indent: 0px;
          text-rendering: auto;
          text-shadow: none;
          text-transform: none;
          transition-duration: 0.4s;
          width: 192px;
          word-spacing: 0px;
          -webkit-box-align: center;
          -webkit-box-pack: center;
          -webkit-border-image: none;
          padding-block-end: 8px;
          padding-block-start: 8px;
          padding-bottom: 8px;
          padding-inline-end: 11.2px;
          padding-inline-start: 11.2px;
          padding-left: 11.2px;
          padding-right: 11.2px;
          padding-top: 8px;
        }

        .content_${this.id} .carrouselSegment{
          width: 100%;
        }
      </style>
      <div class="content_${this.id}">
        <div class="close-container">
          <div class="close">
            <svg class="icon" data-src="/icons/close.svg" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" data-id="svg-loader_25">
              <path d="M1.27197 13.728L13.9999 1.00012" stroke="var(--icon-color, #000)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M1.27197 1L13.9999 13.7279" stroke="var(--icon-color, #000)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
        </div>
        <div class="status">
          ${this.infoDiv_status}
        </div>
        <h3>${this.name}</h3>
        <p class="description">
          ${this.infoDiv_description}
        </p>
        <div class="infoSegment">
          <div class="price">${price} MXN</div>
          <div class="iconsSegment">
            <div class="icon">
              <img src="${bedSVG}" alt="bed">
              <span>${this.infoDiv_rooms}</span>
            </div>
            <div class="icon">
              <img src="${bathSVG}" alt="bath">
              <span>${this.infoDiv_bathrooms}</span>
            </div>
            <div class="icon">
              <img src="${carSVG}" alt="car">
              <span>${this.infoDiv_parking}</span>
            </div>
            <div class="icon">
              <img src="${areaSVG}" alt="area">
              <span>${this.infoDiv_surface} m²</span>
            </div>
          </div>
        </div>
        <div class="carrouselSegment">
          ${carrousel}
        </div>
        <div class="optionsSegment">
          ${options}
        </div>
      </div>
    `
    dialog.querySelector(".close").addEventListener("click", () => dialog.hide())
    this.infoDialog = dialog
    document.body.appendChild(dialog)
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }
  emit(event, ...args) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(...args))
  }
  render() {
    if (!this.renderCanvas) return null
    if (!this.visible) return null

    if (this.displayDarken) {
      return this.darkenCanvas
    }
    return this.renderCanvas
  }
  getPositionAlpha(x, y) {
    if (x == Number.POSITIVE_INFINITY && y == Number.POSITIVE_INFINITY) {
      return 0
    }
    return this.ctx.getImageData(x, y, 1, 1).data[3]
  }
  mouseMove(x, y) {
    const currentVisible = this.visible
    this.visible = this.originalVisible
    this.opacity = this.originalOpacity
    if (this.mouseMoveAction === "toggle") {
      const alpha = this.getPositionAlpha(x, y)
      if (alpha === 0) {
        if (currentVisible) {
          this.visible = false
          this.emit("toggle", this.visible)
          this.emit("hide")
        }
        return
      }
      this.visible = true
      this.emit("toggle", this.visible)
      if (this.visible) this.emit("show")
      return
    }
    if (this.mouseMoveAction === "darken") {
      const alpha = this.getPositionAlpha(x, y)
      if (alpha === 0) {
        this.displayDarken = false
        this.emit("hide")
        return
      }
      this.visible = true
      this.displayDarken = true
      this.emit("show")
    }
  }
  mouseClick(x, y) {
    if (this.mouseAction === "toggleScene") {
      this.emit("hide")
      const alpha = this.getPositionAlpha(x, y)
      if (alpha === 0) return
      console.log(this)
      this.emit("toggleScene", this.mouseActionScene)
      return
    }
    if (this.mouseAction === "custom") {
      const alpha = this.getPositionAlpha(x, y)
      if (alpha === 0) return
      this.emit("hide")
      this.emit("hit")
      return
    }
    if (this.mouseAction === "showInfo") {
      const alpha = this.getPositionAlpha(x, y)
      if (alpha === 0) return
      this.emit("hide")
      this.infoDialog.show()
      return
    }
  }
}
class Scene {
  constructor(options) {
    Object.assign(this, options)
    this.layers = options.layers.map(layer => {
      const l = new Layer(layer)
      l.on("toggle", visible => this.emit("toggle", l, visible))
      l.on("show", () => this.emit("show", l))
      l.on("hide", () => this.emit("hide", l))
      l.on("toggleScene", scene => this.emit("toggleScene", scene))
      l.on("hit", () => this.emit("hit", l))
      return l
    })
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.listeners = {}
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }
  emit(event, ...args) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(...args))
  }
  render() {
    this.canvas.width = this.layers.reduce((acc, layer) => Math.max(acc, layer.canvas.width), 0)
    this.canvas.height = this.layers.reduce((acc, layer) => Math.max(acc, layer.canvas.height), 0)
    this.layers.forEach(layer => {
      const layerCanvas = layer.render()
      if (!layerCanvas) return
      this.ctx.drawImage(layerCanvas, 0, 0)
    })
    return this.canvas
  }
  mouseMove(x, y) {
    this.layers.forEach(layer => layer.mouseMove(x, y))
  }
  mouseClick(x, y) {
    this.layers.forEach(layer => layer.mouseClick(x, y))
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
    this.current = {}
    this.scenes = []
    this.currentScene = null
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.lastUpdate = Date.now()
    this.camera = { x: -10, y: -10 }
    this.cameraDirection = { x: 0, y: 0 }
    this.mouse = { x: 0, y: 0 }
    this.mouseDownPosition = null
    this.drag = null
    this.dragging = false
    this.cameraSpeed = 100
    this.tabIndex = 0
    this.pause = false
    const observer = new ResizeObserver(entries => {
      if (this.canvas.width && this.canvas.height) return
      for (let entry of entries) {
        const { width, height } = entry.contentRect
        this.canvas.width = width
        this.canvas.height = height
        this.render()
      }
    })
    observer.observe(this)
    this.addEventListener("keydown", e => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (this.onAnimation) return
      if (e.key == "ArrowUp") this.cameraDirection.y = 1
      if (e.key == "ArrowDown") this.cameraDirection.y = -1
      if (e.key == "ArrowLeft") this.cameraDirection.x = 1
      if (e.key == "ArrowRight") this.cameraDirection.x = -1
    })
    this.addEventListener("keyup", e => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (e.key == "ArrowUp") this.cameraDirection.y = 0
      if (e.key == "ArrowDown") this.cameraDirection.y = 0
      if (e.key == "ArrowLeft") this.cameraDirection.x = 0
      if (e.key == "ArrowRight") this.cameraDirection.x = 0
      if (e.key == "Escape") this.pause = !this.pause
    })
    this.canvas.addEventListener("wheel", e => {
      e.preventDefault()
      e.stopPropagation()
      if (this.onAnimation) return
      this.zoom -= e.deltaY * .001
      if (this.zoom < .5) this.zoom = .5
      if (this.zoom > 1.5) this.zoom = 1.5
    })
    this.canvas.addEventListener("mousedown", this._onPointerDown.bind(this))
    this.canvas.addEventListener("mouseup", this._onPointerUp.bind(this))
    this.canvas.addEventListener("mousemove", this._onPointerMove.bind(this))
    this.canvas.addEventListener("mouseleave", this._onPointerLeave.bind(this))
    this.canvas.addEventListener("touchstart", (e) => {
      this._onPointerDown(e)
    })
    this.canvas.addEventListener("touchend", (e) => {
      this._onPointerUp(e)
    })
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault()
      this._onPointerMove(e)
    })
    this.canvas.addEventListener("touchleave", (e) => {
      this._onPointerLeave(e)
    })
    this.listeners = {}
    this.onAnimation = false
    this.zoom = .8
  }
  _onPointerDown(e) {
    if (!this.currentScene) return
    this.mousePositionToCanvas(e.clientX, e.clientY)
    e.stopPropagation()
    if (this.onAnimation) return
    this.drag = { ...this.mouse }
    this.mouseDownPosition = { ...this.mouse }
  }
  _onPointerMove(e) {
    if (!this.currentScene) return
    e.stopPropagation()
    if (this.onAnimation) return
    this.mousePositionToCanvas(e.clientX, e.clientY)
    if (!this.drag) {
      const worldPosition = this.screenToWorld(this.mouse.x, this.mouse.y)
      this.currentScene.mouseMove(worldPosition.x, worldPosition.y)
      return
    }
    this.currentScene.mouseMove(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
    this.dragging = true
    this.camera.x += this.mouse.x - this.drag.x
    this.camera.y += this.mouse.y - this.drag.y
    this.drag = { x: this.mouse.x, y: this.mouse.y }
  }
  _onPointerUp(e) {
    if (!this.currentScene) return
    this.mousePositionToCanvas(e.clientX, e.clientY)
    e.stopPropagation()
    e.stopPropagation()
    if (this.onAnimation) return
    this.dragging = false
    if (!this.mouseDownPosition) return
    if (this.mouse.x == this.mouseDownPosition.x || this.mouse.y == this.mouseDownPosition.y) {
      this.drag = null
      const worldPosition = this.screenToWorld(this.mouse.x, this.mouse.y, true)
      this.currentScene.mouseClick(worldPosition.x, worldPosition.y)
      return
    }
    this.drag = null
  }
  _onPointerLeave(e) {
    if (!this.currentScene) return
    e.stopPropagation()
    e.stopPropagation()
    if (this.onAnimation) return
    this.dragging = false
    this.drag = null
    this.currentScene.mouseClick(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback)
  }
  emit(event, ...args) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(...args))
  }
  set data(value) {
    if (!value) {
      this.current = {}
      this.scenes = []
      this.currentScene = null
      this.requestUpdate()
      return
    }
    const unbase64 = atob(value)
    const data = JSON.parse(unbase64)
    this.current = data
    this.scenes = data.scenes.map(scene => {
      const s = new Scene(scene)
      s.on("toggle", (layer, visible) => {
        this.emit("toggle", s, layer, visible)
      })
      s.on("show", layer => {
        this.shadowRoot.appendChild(layer.infoDiv)
        this.emit("show", s, layer)
      })
      s.on("hide", layer => {
        this.emit("hide", s, layer)
        if (!this.shadowRoot.contains(layer.infoDiv)) return
        this.shadowRoot.removeChild(layer.infoDiv)
      })
      s.on("hit", (layer) => {
        this.emit("hit", s, layer)
      })
      s.on("toggleScene", scene => {
        console.log(this.scenes)
        const newScene = this.scenes.find(s => s.id === scene)
        if (!newScene) return
        this.currentScene = newScene
        this.centerScene()
      })
      return s
    })
    this.currentScene = this.scenes[0]
  }
  centerScene() {
    // if (!this.currentScene) return requestAnimationFrame(() => this.centerScene())
    // this.camera = { x: -1 * this.currentScene.canvas.width / 2, y: -1 * this.currentScene.canvas.height / 2 }
  }
  mousePositionToCanvas(x, y) {
    const canvasPosition = this.canvas.getBoundingClientRect()
    this.canvas.width = canvasPosition.width
    this.canvas.height = canvasPosition.height
    this.mouse = { x: x - canvasPosition.x, y: y - canvasPosition.y }
    return this.mouse
  }
  screenToWorld(x, y) {
    return {
      x: (x - this.camera.x) / this.zoom,
      y: (y - this.camera.y) / this.zoom
    }
  }

  calculateCamera(delta, sceneCanvas) {
    this.camera.x += this.cameraDirection.x * this.cameraSpeed * delta
    this.camera.y += this.cameraDirection.y * this.cameraSpeed * delta
    const canvasWidth = this.canvas.width / this.zoom
    const canvasHeight = this.canvas.height / this.zoom
    const cameraX = this.camera.x * -1 / this.zoom
    const cameraY = this.camera.y * -1 / this.zoom

    if (sceneCanvas.width < canvasWidth) this.camera.x = 0
    if (sceneCanvas.height < canvasHeight) this.camera.y = 0
    if (sceneCanvas.width < canvasWidth || sceneCanvas.height < canvasHeight) return
    if (this.camera.x > 0) this.camera.x = 0
    if (this.camera.y > 0) this.camera.y = 0
    if (cameraX + canvasWidth > sceneCanvas.width) this.camera.x -= sceneCanvas.width - (cameraX + canvasWidth)
    if (cameraY + canvasHeight > sceneCanvas.height) this.camera.y -= sceneCanvas.height - (cameraY + canvasHeight)
  }
  animate() {
    if (this.pause) return requestAnimationFrame(() => this.animate())
    if (this.onAnimation) return requestAnimationFrame(() => this.animate())
    if (!this.currentScene) return requestAnimationFrame(() => this.animate())
    const delta = (Date.now() - this.lastUpdate) / 1000
    this.lastUpdate = Date.now()
    const sceneCanvas = this.currentScene.render()
    this.calculateCamera(delta, sceneCanvas)

    this.ctx.resetTransform()
    this.ctx.translate(this.camera.x, this.camera.y)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.clearRect(sceneCanvas.width * -1, sceneCanvas.height * -1, sceneCanvas.width, sceneCanvas.height)
    this.ctx.scale(this.zoom, this.zoom)
    this.ctx.drawImage(sceneCanvas, 0, 0)
    // setTimeout(() => {
    //   this.animate()
    // }, 1000)
    requestAnimationFrame(() => this.animate())
  }
  firstRendered() {
    this.animate()
    this.centerScene()
  }
  render() {
    return this.html`
      ${this.canvas}
    `
  }
}
ShowRoom.define("show-room")
export default ShowRoom