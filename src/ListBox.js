const initialState = {
  name: '',
  value: '',
  element: null,
  isOpen: false,
  placeholder: null,
  firstRender: true,
}

export class ListBox extends HTMLElement {
  #state

  constructor() {
    super()

    this.attachShadow({ mode: 'open' })
    this.#state = { ...initialState }
    this.controller = new AbortController()
  }

  static get observedAttributes() {
    return ['open']
  }

  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) {
      return
    }

    this[property] = newValue

    if (property === 'open') {
      this.#state.isOpen = !this.#state.isOpen
    }
  }

  get state() {
    return this.#state
  }

  set state(newState) {
    this.#state = { ...this.#state, ...newState }
  }

  get slotted() {
    return Array.from(this.querySelectorAll('[slot=listbox-option]'))
  }

  get toggle() {
    return this.shadowRoot.querySelector('[part=toggle]')
  }

  get toggleValue() {
    return this.shadowRoot.querySelector('[part=toggle-value]')
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          contain: content;
          font: inherit;
          position: relative;
        }

        :host::part(container) {
          position: relative;
        }

        :host::part(toggle) {
          font: inherit;
          position: relative;
        }

        :host::part(toggle-icon) {
          pointer-events: none;
        }

        :host::part(listbox) {
          display: none;
          inset-inline: 0;
          position: absolute;
          z-index: 1;
        }

        :host([open])::part(listbox) {
          display: block;
        }
      </style>

      <div part="container">
        <button part="toggle" aria-expanded="false">
          <span part="toggle-value"></span>
          <slot name="listbox-toggle-icon" part="toggle-icon"></slot>
        </button>
        <div part="listbox">
          <div role="listbox" part="listbox-options">
            <slot name="listbox-option"></slot>
          </div>
        </div>
      </div>  
    `

    this.setInitialState()

    const { signal } = this.controller

    for (const option of this.slotted) {
      option.setAttribute('tabindex', '0')
      option.setAttribute('role', 'option')

      option.addEventListener('mouseup', this.handleSelect.bind(this), { signal })
    }

    this.render()

    this.toggle.addEventListener('mousedown', this.handleToggle.bind(this), { signal })
    this.shadowRoot.addEventListener('keydown', this.handleKeys.bind(this), { signal })
    this.addEventListener('focusout', this.handleElementFocusLoss.bind(this), { signal })
  }

  disconnectedCallback() {
    this.controller.abort()
  }

  setInitialState() {
    const initialValue = this.getAttribute('initial-value')
    const placeholder = this.getAttribute('placeholder')
    const isOpen = this.hasAttribute('open')

    const defaultState = {
      name: this.slotted[0].textContent,
      value: this.slotted[0].getAttribute('value'),
      element: this.slotted[0],
      isOpen: false,
      placeholder: null,
      firstRender: true,
    }

    if (initialValue) {
      const option = this.slotted.find(option => {
        return option.textContent === initialValue || option.getAttribute('value') === initialValue
      })

      if (option) {
        this.state = {
          name: option.textContent,
          value: option.getAttribute('value'),
          element: option,
        }
      } else {
        this.state = { ...defaultState }
      }
    } else {
      this.state = { ...defaultState }
    }

    if (isOpen) {
      this.state = { isOpen: true }
    }

    if (placeholder) {
      this.state = { placeholder }
    }
  }

  handleToggle() {
    const { isOpen } = this.state

    isOpen ? this.handleClose() : this.handleOpen()
  }

  handleOpen() {
    const { element } = this.state

    this.setAttribute('open', '')
    this.toggle.setAttribute('aria-expanded', 'true')

    setTimeout(() => {
      element.focus()
    }, 0)
  }

  handleClose() {
    this.removeAttribute('open')
    this.toggle.setAttribute('aria-expanded', 'false')
    this.toggle.focus()
  }

  handleKeys(e) {
    const { isOpen } = this.state
    const keys = [' ', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown']

    if (keys.includes(e.key) && isOpen) {
      e.preventDefault()
    }

    const currentElement = document.activeElement

    switch (e.key) {
      case ' ':
        if (e.target === this.toggle) {
          this.handleToggle()
        } else if (this.slotted.includes(e.target)) {
          this.handleSelect(e)
        }
        return
      case 'Escape':
        this.handleClose()
        return
      case 'Tab':
        this.handleClose()
        return
      case 'ArrowUp':
        if (currentElement === this.slotted[0]) return
        currentElement.previousElementSibling.focus()
        return
      case 'ArrowDown':
        if (currentElement === this.slotted[this.slotted.length - 1]) return
        currentElement.nextElementSibling.focus()
        return
    }
  }

  handleSelect(e) {
    const option = e.target.closest('[slot=listbox-option]')

    if (!option) {
      return
    }

    const newName = option.textContent
    const newValue = option.getAttribute('value')

    this.state = { name: newName, value: newValue, element: option }
    this.render()
  }

  handleElementFocusLoss(e) {
    if (!this.contains(e.relatedTarget)) {
      this.handleClose()
    }
  }

  dispatch() {
    const { value } = this.state
    const changeEvent = new CustomEvent('change', {
      bubbles: true,
      detail: { value: value },
    })

    this.dispatchEvent(changeEvent)
  }

  render() {
    const { name, element, placeholder, firstRender } = this.state

    if (placeholder && firstRender) {
      this.toggleValue.textContent = placeholder
    } else {
      this.toggleValue.textContent = name
    }

    for (const option of this.slotted) {
      if (option === element) {
        option.setAttribute('aria-selected', 'true')
      } else {
        option.setAttribute('aria-selected', 'false')
      }
    }

    if (!firstRender) {
      this.handleClose()
    }

    this.#state.firstRender = false
    this.dispatch()
  }
}

if (!customElements.get('list-box')) {
  customElements.define('list-box', ListBox)
}
