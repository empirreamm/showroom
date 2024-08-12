import SioElement from "../sio/SioElement.js"

class SioDialog extends SioElement {
  static styles = `
    /**defaults**/
    *{
      box-sizing:border-box;
    }
    :host {
      --card-box-shadow-1: rgba(0, 0, 0, 0.05);
      --card-box-shadow-1-y: 3px;
    }
    :host([full-width]) dialog {
      width: 90vw;
    }
    dialog {
      background-color:var(--background-color, #fff);
      border:1px solid var(--color, #333);
      box-shadow:var(--card-box-shadow-1) 0 var(--card-box-shadow-1-y) var(--card-box-shadow-1-blur),var(--card-box-shadow-2) 0 var(--card-box-shadow-2-y) var(--card-box-shadow-2-blur);
      padding:0;
      transition:all 0.5s ease-in-out;
      opacity:0;
      transform:scaleY(0);
      overscroll-behavior:contain;
      color:var(--color, #333);
      padding: var(--safe-padding, 16px);
      width: fit-content;
      max-width: 90vw;
      max-height: 90vh;
    }
    dialog[open] {
      opacity:1;
      transform:scaleY(1);
    }
    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: scaleY(0);
      }
    }
    dialog::backdrop {
      background-color:var(--background-color-window,#333e);
      backdrop-filter: blur(5px);
      opacity:0;
      transform:scaleX(0);
      transition:all 0.1s ease-in-out;
      overscroll-behavior:contain;
    }
    dialog[open]::backdrop{
      Opacity:1;
      transform:scaleX(1);
    }
    @starting-style {
      dialog[open]::backdrop{
        opacity: 0;
        transform: scale(0);
      }
    }
    .close{
      display:none;
    }
    :host([close]) .close{
      position: absolute;
      display:block;
      z-index: 1000;
    }
  `
  static properties = {
    preventBackdrop: {
      type: Boolean,
      default: false,
      attribute: true
    }
  }
  constructor() {
    super()
    this._open = false
  }
  get open() {
    return this._open
  }
  set open(value) {
    if (value) {
      this.showModal()
    } else {
      this.hideModal()
    }
  }
  disconnectedCallback() {
    this.hideModal()
  }
  closeIfBackdrop(event) {
    if (this.preventBackdrop) return
    const dialog = this.root.querySelector("dialog")
    var rect = dialog.getBoundingClientRect()
    var isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX && event.clientX <= rect.left + rect.width)
    if (!isInDialog) {
      dialog.close()
    }
  }
  showModal(e) {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    this._open = true
    const found = this.root.querySelector("dialog")
    if (!found) {
      return requestAnimationFrame(() => this.showModal())
    }
    this.root.querySelector("dialog").showModal()
    document.body.inert = true
    document.body.style.overflow = "hidden"
    this.emit("open")
  }
  _onClose() {
    this._open = false
    document.body.inert = false
    document.body.style.overflow = "auto"
    this.emit("close")
  }
  hideModal() {
    this._open = false
    this.root.querySelector("dialog")?.close()
    this._onClose()
  }
  close() {
    this.hideModal()
  }
  open() {
    this.showModal()
  }
  show() {
    this.showModal()
  }
  hide() {
    this.hideModal()
  }
  render() {
    return this.html`
      <dialog @close=${this._onClose.bind(this)} @click=${this.closeIfBackdrop.bind(this)}>
        <div class="close">
          <sio-button @click=${this.close.bind(this)}>Cerrar</sio-button>
        </div>
        <slot></slot>
        
      </dialog>
    `
  }
}
SioDialog.define("sio-dialog")
export default SioDialog
