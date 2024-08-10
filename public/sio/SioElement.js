import { html, unsafeHTML, render, classMap, styleMap, Directive, directive, AsyncDirective } from "https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js"

class SioElement extends HTMLElement {
  static define(name) {
    if (!name) {
      name = this.name
    }
    name = name
      .replace(/^[A-Z]/, (letter) => letter.toLowerCase())
      .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    if (!customElements.get(name)) {
      customElements.define(name, this)
    }
  }

  static get observedAttributes() {
    const list = []
    for (let prop in this.properties) {
      if (this.properties[prop].attribute) {
        list.push(prop.toLowerCase())
      }
    }
    return list
  }

  static get properties() {
    return {}
  }

  __styleElement = null;
  __updates = 0;
  __renders = 0;

  constructor() {
    super()
    this.html = html
    this.unsafeHTML = unsafeHTML
    this.classMap = classMap
    this.styleMap = styleMap
    this.root = this
    this.initializeProperties()
    this.__styleElement = document.createElement("style")
    this.__styleElement.innerHTML = `
      ${this.constructor.styles || ''}
      :host([hidden]) {
        display: none;
      }
      :host([disabled]) {
        pointer-events: none;
      }
    `
    this.updateDebounce = null
  }

  initializeProperties() {
    const properties = this.constructor.properties
    for (let prop in properties) {
      const def = properties[prop].default || null
      this[`_${prop}`] = this[prop] || def || false
      if (properties[prop].attribute) {
        this.updateAttribute(prop)
      }
    }
  }

  updateAttribute(prop) {
    if (this[`_${prop}`]) {
      this.setAttribute(prop, this[`_${prop}`])
    } else {
      this.removeAttribute(prop)
    }
    this.propertyChangedCallback(prop, null, this[`_${prop}`])
  }

  async propertyChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (typeof this.propertyChanged === "function") {
        await this.propertyChanged(name, oldValue, newValue)
      }
      this.requestUpdate()
    }
  }

  connectedCallback() {
    // Attach Shadow DOM unless marked as notShadowed
    const hasShadowRoot = !!this.shadowRoot
    if (!this.constructor.notShadowed && !hasShadowRoot) {
      this.root = this.attachShadow({ mode: "open" })
    }
    const attributes = this.constructor.observedAttributes
    const propertiesKeys = Object.keys(this.constructor.properties)
    for (const attribute of attributes) {
      const prop = propertiesKeys.find((prop) => prop.toLowerCase() === attribute.toLowerCase())
      const propData = this.constructor.properties[prop]
      if (this.hasAttribute(attribute)) {
        if (!this.getAttribute(attribute) && propData.type === Boolean) {
          this[`_${prop}`] = true
        } else {
          this[`_${prop}`] = this.getAttribute(attribute)
        }
      }
    }
    this.emit("connected")
    this.requestUpdate()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === "") {
      newValue = true
    }
    if (oldValue !== newValue) {
      const prop = Object.keys(this.constructor.properties).find(
        (prop) => prop.toLowerCase() === name.toLowerCase()
      )
      const propData = this.constructor.properties[prop]
      if (propData.type && typeof propData.type === "function") {
        newValue = propData.type === Boolean ? parseBoolean(newValue) : propData.type(newValue)
      }
      this[`${prop}`] = newValue
      this.propertyChangedCallback(prop, oldValue, newValue)
    }
  }

  __drawToParent(content, parent) {
    return render(content, parent)
  }

  __drawContentToRoot(content) {
    return this.__drawToParent(content, this.root)
  }

  emit(name, data) {
    const event = new CustomEvent(name, { detail: data })
    this.dispatchEvent(event)
    return event
  }

  hasChanged(oldValue, newValue) {
    if (oldValue !== newValue) {
      this.requestUpdate()
    }
  }

  async requestUpdate() {
    if (this.updateDebounce) {
      clearTimeout(this.updateDebounce)
    }
    this.updateDebounce = setTimeout(async () => {
      this.emit("updateRequested")
      await this.__update()
    }, 0)
  }

  async __update() {
    this.__updates++
    if (this.__updates === 1) {
      if (typeof this.init === "function") {
        await this.init()
      }
    }
    if (typeof this.update === "function") {
      const res = await this.update()
      if (res === false) {
        return
      }
    }
    if (this.__updates === 1) {
      if (typeof this.firstUpdated === "function") {
        this.firstUpdated()
      }
    }
    this.__render()

    if (typeof this.updated === "function") {
      this.updated()
    }
    this.emit("updated")
  }

  __render() {
    const data = [this.__styleElement]
    if (typeof this.render === "function") {
      data.push(this.render())
    }
    this.__drawContentToRoot(data)
    this.__renders++
    if (this.__renders === 1) {
      if (typeof this.firstRendered === "function") {
        this.firstRendered()
      }
    }
    if (typeof this.rendered === "function") {
      this.rendered()
    }
  }
}

// Helper function
function parseBoolean(value) {
  return ![false, "false", "0", 0, "no", "n", "off", "disabled", "undefined", "null", "NaN", ""].includes(value)
}

export default SioElement
export { html, unsafeHTML, render, classMap, styleMap, Directive, directive, AsyncDirective }