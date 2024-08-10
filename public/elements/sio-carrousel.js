import SioElement from "../sio/SioElement.js"
class SioCarrousel extends SioElement {
  static properties = {
    stringdata: { type: String, attribute: true }
  }
  static styles = `
    :host {
      max-width: 100%;
      max-height: 100%;
    }
    .carrousel {
      display: grid;
      grid-template-areas: "current miniatures";
      grid-template-columns: 2fr 1fr;
    }
    .current {
      position: relative;
      grid-area: current;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .miniatures {
      position: relative;
      grid-area: miniatures;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 100%;
      overflow: hidden;
    }
    .miniatures img {
      max-width:200px;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      cursor: pointer;
      transition: transform 0.5s ease, opacity 0.5s ease;
    }
    img.enter {
      transform: translateX(100%);
      opacity: 0;
    }
    img.enter-active {
      transform: translateX(0);
      opacity: 1;
    }
    img.leave {
      transform: translateX(0);
      opacity: 1;
    }
    img.leave-active {
      transform: translateX(-100%);
      opacity: 0;
    }
    
  `
  constructor() {
    super()
    this.current = 0
    this.items = []
    this.deboucer = null
  }
  set data(value) {
    if (!value) {
      this.items = []
      this.current = 0
      this.requestUpdate()
      return
    }
    this.items = value
    this.current = 0
    this.requestUpdate()
    this.resetDeboucer()
  }
  get data() {
    return this.items
  }
  resetDeboucer() {
    if (this.deboucer) clearTimeout(this.deboucer)
    this.deboucer = setTimeout(() => {
      this.next()
    }, 5000)
  }
  propertyChanged(name, oldValue, newValue) {
    if (name === "stringdata") {
      console.log("setting string data", newValue)
      this.items = newValue ? newValue.split("|") : []
      this.current = 0
      this.requestUpdate()
      this.resetDeboucer()
    }
  }
  next() {
    this.goTo(this.current + 1)
  }
  previous() {
    this.goTo(this.current - 1)
  }
  goTo(index) {
    if (index >= this.items.length) index = 0
    if (index < 0) index = this.items.length - 1
    this.current = index
    this.resetDeboucer()
    this.requestUpdate()
  }
  renderMiniatures() {
    return this.items.map((item, index) => this.html`
      <img src="${item}" alt="miniature" @click=${() => this.goTo(index)}>
    `)
  }
  render() {
    console.log("rendering carrousel", this.items)
    return this.html`
      <div class="carrousel">
        <div class="current">
          <img src="${this.items[this.current]}" alt="current" class="leave">
        </div>
        <div class="miniatures">
          ${this.renderMiniatures()}
        </div>
      </div>
    `
  }
}
SioCarrousel.define('sio-carrousel')
export default SioCarrousel