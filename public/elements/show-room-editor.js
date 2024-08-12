import SioElement from "/sio/SioElement.js"
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
class ShowRoomEditor extends SioElement {
  static properties = {
    data: { type: String, default: "", attribute: true },
  }
  static styles = `
    :host {
      display: block;
      padding: 8px;
      border-radius: 8px;
      background-color: #f0f0f0;
      border: 1px solid #e0e0e0;
    }
    details {
      margin: 8px;
      padding: 8px;
    }
    summary {
      font-weight: bold;
      cursor: pointer;
      user-select: none;
    }
    .scene{
      border-left: 8px solid #e0e0e0;
    }
    .layer{
      border-left: 8px solid #a0a0ff;
    }
    .input-container {
      display: flex;
      flex-direction: column;
      margin: 6px;
      align-items: flex-start;
    }
    .input-container label {
      width: 100%;
      color: #33f;
    } 
    .input-container input:not([type="checkbox"]) {
      padding: 4px;
      margin: 4px;
      border:0;
      border-left: 2px solid #33f;
    }
    .input-container input[type="checkbox"] {
      margin: 4px;
      width:auto;
    }
    .double-column {
      display: grid;
      grid-template-columns: auto 1fr;
    }
    img {
      max-width: 100%;
      max-height: 100px;
    }
    button {
      padding: 4px;
      margin: 4px;
      border: 1px solid #33f;
      background-color: #33f;
      color: white;
      border-radius: 4px;
      cursor: pointer;
    }
  `
  constructor() {
    super()
    this.current = this.defaultCurrent()
  }
  propertyChanged(name, oldValue, newValue) {
    if (name === "data") {
      if (!newValue) {
        this.current = this.defaultCurrent()
        return
      }
      try {
        const unbase64 = atob(newValue)
        const data = JSON.parse(unbase64)
        this.current = data
      } catch (e) {
        console.error(e)
        this.current = this.defaultCurrent()
      }
    }
  }
  set data(value) {
    const unbase64 = atob(value)
    const data = JSON.parse(unbase64)
    this.current = data
    this.requestUpdate()
  }
  createLayer(sceneId) {
    const scene = this.current.scenes.find(scene => scene.id === sceneId)
    if (!scene) {
      return
    }
    scene.layers.push({
      name: `Capa ${scene.layers.length + 1}`,
      image: "https://via.placeholder.com/150",
      id: uuid(),
      visible: true,
      mouseMoveAction: "none",
      mouseAction: "none",
      mouseActionScene: null,
      color: "#000000",
      opacity: 1
    })
    this.save()
    this.requestUpdate()
  }
  deleteLayer(sceneId, layerId) {
    const scene = this.current.scenes.find(scene => scene.id === sceneId)
    if (!scene) {
      return
    }
    const index = scene.layers.findIndex(layer => layer.id === layerId)
    if (index === -1) {
      return
    }
    scene.layers.splice(index, 1)
    this.save()
    this.requestUpdate()
  }
  renameLayer(sceneId, layerId, name) {
    const scene = this.current.scenes.find(scene => scene.id === sceneId)
    if (!scene) {
      return
    }
    const layer = scene.layers.find(layer => layer.id === layerId)
    if (!layer) {
      return
    }
    layer.name = name
    this.save()
    this.requestUpdate()
  }
  updateLayerInfo(sceneId, layerId, key, value) {
    const scene = this.current.scenes.find(scene => scene.id === sceneId)
    if (!scene) {
      return
    }
    const layer = scene.layers.find(layer => layer.id === layerId)
    if (!layer) {
      return
    }
    layer[key] = value
    this.save()
    this.requestUpdate()
  }
  changeImage(sceneId, layerId, image) {
    const scene = this.current.scenes.find(scene => scene.id === sceneId)
    if (!scene) {
      return
    }
    const layer = scene.layers.find(layer => layer.id === layerId)
    if (!layer) {
      return
    }
    layer.image = image
    this.save()
    this.requestUpdate()
  }
  createScene() {
    this.current.scenes.push({
      name: `Escena ${this.current.scenes.length + 1}`,
      layers: [
        {
          name: "Capa 1",
          image: "https://via.placeholder.com/150",
          id: uuid(),
          visible: true,
          mouseMoveAction: "none",
          mouseAction: "none",
          mouseActionScene: null,
          color: "#000000",
          opacity: 1
        }
      ],
      id: uuid()
    })
    this.save()
    this.requestUpdate()
  }
  deleteScene(id) {
    if (this.current.scenes.length === 1) {
      return
    }
    const index = this.current.scenes.findIndex(scene => scene.id === id)
    if (index === -1) {
      return
    }
    this.current.scenes.splice(index, 1)
    this.save()
    this.requestUpdate()
  }
  renameScene(id, name) {
    const scene = this.current.scenes.find(scene => scene.id === id)
    if (!scene) {
      return
    }
    scene.name = name
    this.save()
    this.requestUpdate()
  }
  _onRenameScene(id) {
    return (e) => {
      const value = e.target.value || `Escena ${index + 1}`
      this.renameScene(id, value)
    }
  }
  _onRenameLayer(sceneId, layerId) {
    return (e) => {
      const value = e.target.value || `Capa ${index + 1}`
      this.renameLayer(sceneId, layerId, value)
    }
  }
  _onImageChange(sceneId, layerId) {
    return (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const image = e.target.result
        this.changeImage(sceneId, layerId, image)
      }
      reader.readAsDataURL(file)
    }
  }
  _onValueChange(sceneId, layerId, key, type = "text") {
    return (e) => {
      let value = e.target.value
      if (e.target.type === "checkbox") {
        this.updateLayerInfo(sceneId, layerId, key, e.target.checked)
        return
      }
      if (type === "numeric") {
        value = value.replace(/[^0-9\.]/g, "")
      }
      if (type === "integer") {
        value = value.replace(/[^0-9]/g, "")
      }
      this.updateLayerInfo(sceneId, layerId, key, value)
    }
  }
  defaultCurrent() {
    return {
      scenes: [
        {
          name: "Escena 1",
          layers: [
            {
              id: uuid(),
              name: "Capa 1",
              image: "https://via.placeholder.com/150",
              visible: true,
              mouseAction: "none"
            }
          ],
          id: uuid()
        }
      ]
    }
  }
  renderLayer(scene, layer, index) {
    const deleteButton = index === 0 ? null : this.html`<button @click=${this.deleteLayer.bind(this, scene.id, layer.id)}>Eliminar capa</button>`
    const validScenes = this.current.scenes.filter(vs => vs.id !== scene.id)
    const sceneSelect = this.html`
      <div class="input-container">
        <label>Escena:</label>
        <select ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "mouseActionScene").bind(this)}>
          <option value="">Ninguno</option>
          ${validScenes.map(scene => this.html`<option value=${scene.id} ?selected=${layer.mouseActionScene === scene.id}>${scene.name}</option>`)}
        </select>
      </div>
    `
    const showMouseActionScene = layer.mouseAction === "toggleScene" && validScenes.length > 0 ? sceneSelect : null

    const infoDiv = this.html`
      <div class="input-container">
        <label>Estado:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_status").bind(this)} value="${layer.infoDiv_status || ""}" />
      </div>
      <div class="input-container">
        <label>Precio:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_price", "numeric").bind(this)} value="${layer.infoDiv_price || ""}" inputmode="numeric"/>
      </div>
      <div class="input-container">
        <label>Habitaciones:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_rooms", "integer").bind(this)} value="${layer.infoDiv_rooms || ""}" inputmode="numeric" />
      </div>
      <div class="input-container">
        <label>Baños:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_bathrooms", "integer").bind(this)} value="${layer.infoDiv_bathrooms || ""}" inputmode="numeric"/>
      </div>
      <div class="input-container">
        <label>Superficie (m<sup>2</sup>):</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_surface", "numeric").bind(this)} value="${layer.infoDiv_surface || ""}" inputmode="numeric"/>
      </div>
      <div class="input-container">
        <label>Estacionamientos:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_parking", "integer").bind(this)} value="${layer.infoDiv_parking || ""}" inputmode="numeric"/>
      </div>
      <div class="input-container">
        <label>Descripción:</label>
        <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_description").bind(this)} value="${layer.infoDiv_description || ""}" />
      </div>
      <div class="input-container">
        <label>Link 1:</label>
        <div class="input-container">
          <label>Texto 1:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links1_text").bind(this)} value="${layer.infoDiv_links1_text || ""}" />
        </div>
        <div class="input-container">
          <label>URL 1:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links1_url").bind(this)} value="${layer.infoDiv_links1_url || ""}" />
        </div>
      </div>
      <div class="input-container">
        <label>Link 2:</label>
        <div class="input-container">
          <label>Texto 2:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links2_text").bind(this)} value="${layer.infoDiv_links2_text || ""}" />
        </div>
        <div class="input-container">
          <label>URL 2:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links2_url").bind(this)} value="${layer.infoDiv_links2_url || ""}" />
        </div>
      </div>
      <div class="input-container">
        <label>Link 3:</label>
        <div class="input-container">
          <label>Texto 3:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links3_text").bind(this)} value="${layer.infoDiv_links3_text || ""}" />
        </div>
        <div class="input-container">
          <label>URL 3:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_links3_url").bind(this)} value="${layer.infoDiv_links3_url || ""}" />
        </div>
      </div>
      <div class="input-container">
        <label>Imagenes:</label>
        <div class="input-container">
          <label>Imagen 1:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_images1").bind(this)} value="${layer.infoDiv_images1 || ""}" />
          <p>Imagen actual: ${layer.infoDiv_images1}</p>
        </div>
        <div class="input-container">
          <label>Imagen 2:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_images2").bind(this)} value="${layer.infoDiv_images2 || ""}" />
          <p>Imagen actual: ${layer.infoDiv_images2}</p>
        </div>
        <div class="input-container">
          <label>Imagen 3:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_images3").bind(this)} value="${layer.infoDiv_images3 || ""}" />
          <p>Imagen actual: ${layer.infoDiv_images3}</p>
        </div>
        <div class="input-container">
          <label>Imagen 4:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_images4").bind(this)} value="${layer.infoDiv_images4 || ""}" />
          <p>Imagen actual: ${layer.infoDiv_images4}</p>
        </div>
        <div class="input-container">
          <label>Imagen 5:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "infoDiv_images5").bind(this)} value="${layer.infoDiv_images5 || ""}" />
          <p>Imagen actual: ${layer.infoDiv_images5}</p>
        </div>
      </div>
    `
    return this.html`
      <details class="layer">
        <summary>${layer.name}</summary>
        <div class="input-container">
          <label>Nombre de la capa:</label>
          <input type="text" value=${layer.name} @change=${this._onRenameLayer(scene.id, layer.id).bind(this)} />
        </div>
        <div class="double-column">
          <div class="input-container">
            <label>Imagen:</label>
            <input type="file" accept="image/*" @change=${this._onImageChange(scene.id, layer.id)} />
            <p>Imagen actual: ${layer.image}</p>
          </div>
        </div>
        <div class="input-container">
          <label>Visible:</label>
          <input type="checkbox" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "visible").bind(this)} ?checked=${layer.visible} />
        </div>
        <div class="input-container">
          <label>Movimiento de mouse:</label>
          <select ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "mouseMoveAction").bind(this)}>
            <option value="none">Ninguno</option>
            <option value="darken" ?selected=${layer.mouseMoveAction === "darken"}>Oscurecer</option>
            <option value="toggle" ?selected=${layer.mouseAction === "toggle"}>Alternar visibilidad</option>
          </select>
        </div>
        <div class="input-container">
          <label>Acción de mouse:</label>
          <select ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "mouseAction").bind(this)}>
            <option value="none">Ninguno</option>
            <option value="toggleScene" ?selected=${layer.mouseAction === "toggleScene"}>Alternar escena</option>
            <option value="showInfo" ?selected=${layer.mouseAction === "showInfo"}>Mostrar información</option>
            <option value="custom" ?selected=${layer.mouseAction === "custom"}>Personalizado</option>
          </select>
        </div>
        ${showMouseActionScene}
        <div class="input-container">
          <label>Sumar color:</label>
          <input type="color" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "color").bind(this)} value="${layer.color || "#000000"}" />
        </div>
        <div class="input-container">
          <label>Opacidad:</label>
          <input type="range" min="0" max="1" step="0.01" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "opacity").bind(this)} value="${layer.opacity || 1}" />
          <input type="number" min="0" max="1" step="0.01" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "opacity").bind(this)} value="${layer.opacity || 1}" />
        </div>
        <div class="input-container">
          <label>Información extra:</label>
          <input type="text" ?disabled=${index === 0 ? "disabled" : null} @change=${this._onValueChange(scene.id, layer.id, "extra").bind(this)} value="${layer.extra || ""}" />
        </div>
        ${layer.mouseAction === "showInfo" ? infoDiv : null}
        ${deleteButton}
      </details>
    `
  }
  renderScene(scene, index) {
    const deleteButton = index === 0 ? null : this.html`<button @click=${this.deleteScene.bind(this, scene.id)}>Eliminar Escena</button>`
    return this.html`
      <details class="scene">
        <summary>${scene.name}</summary>
        <div class="input-container">
          <label>Nombre de la escena:</label>
          <input type="text" value=${scene.name} @change=${this._onRenameScene(scene.id).bind(this)} data-index=${index} />
        </div>
        ${scene.layers.map((layer, index) => this.renderLayer(scene, layer, index))}
        <button @click=${this.createLayer.bind(this, scene.id)}>Agregar Capa</button>
        ${deleteButton}
      </details>
    `
  }
  renderScenes() {
    return this.html`
        ${this.current.scenes.map((scene, index) => this.renderScene(scene, index))}
        <button @click=${this.createScene.bind(this)}>Agregar Escena</button>
    `
  }
  render() {
    return this.html`
      <h1> Room Editor</h1>
      ${this.renderScenes()}
    `
  }
  save() {
    const base64 = btoa(JSON.stringify(this.current))
    this.emit("save", base64)
  }
}
ShowRoomEditor.define("show-room-editor")
export default ShowRoomEditor