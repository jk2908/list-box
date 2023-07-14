const initialState = {
  id: undefined,
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

  get options() {
    return Array.from(this.querySelectorAll('[slot=listbox-option]'))
  }

  get toggle() {
    return this.shadowRoot.querySelector('[part=toggle]')
  }

  get toggleValue() {
    return this.shadowRoot.querySelector('[part=toggle-value]')
  }

  get listBox() {
    return this.shadowRoot.querySelector('[part=listbox]')
  }

  async connectedCallback() {
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
        <div part="listbox" role="listbox" part="options">
          <slot name="listbox-option"></slot>
        </div>
      </div>  
    `

    await this.setInitialState()

    const { signal } = this.controller

    for (const slot of this.options) {
      slot.tabIndex = '0'
      slot.role = 'option'
      slot.value = slot.getAttribute('value')
    }

    const { isOpen } = this.state

    if (isOpen) {
      this.handleOpen()
    }

    this.listBox.addEventListener(
      'mouseup',
      e => {
        const targetElement = e.target.closest('[slot=listbox-option]')

        if (targetElement) {
          this.handleSelect(targetElement, () => this.render())
        }
      },
      { signal }
    )

    this.toggle.addEventListener('mousedown', this.handleToggle.bind(this), { signal })
    this.shadowRoot.addEventListener('keydown', this.handleKeys.bind(this), { signal })
    this.addEventListener('focusout', this.handleElementFocusLoss.bind(this), { signal })

    queueMicrotask(() => {
      this.render()
      this.dispatch('ready')
    })
  }

  disconnectedCallback() {
    this.controller.abort()
    this.dispatch('destroy')
  }

  async setInitialState() {
    const initialValue = this.getAttribute('initial-value')
    const placeholder = this.getAttribute('placeholder')
    const isOpen = this.hasAttribute('open')

    const defaultState = {
      name: this.options[0].textContent,
      value: this.options[0].getAttribute('value'),
      element: this.options[0],
      isOpen: false,
      placeholder: null,
      firstRender: true,
    }

    if (initialValue) {
      const option = this.options.find(option => {
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
    const { element, firstRender } = this.state

    this.setAttribute('open', '')
    this.toggle.ariaExpanded = true

    if (!firstRender) {
      setTimeout(() => {
        element.focus()
      }, 0)
    }
  }

  handleClose() {
    this.removeAttribute('open')
    this.toggle.ariaExpanded = false
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
        } else if (this.options.includes(e.target)) {
          this.handleSelect(e.target.closest('[slot=listbox-option]'), () => this.render())
        }
        return
      case 'Escape':
        this.handleClose()
        return
      case 'Tab':
        this.handleClose()
        return
      case 'ArrowUp':
        if (currentElement === this.options[0]) return
        currentElement.previousElementSibling.focus()
        return
      case 'ArrowDown':
        if (currentElement === this.options[this.options.length - 1]) return
        currentElement.nextElementSibling.focus()
        return
    }
  }

  handleSelect(targetElement, fn) {
    if (!targetElement) {
      return
    }

    const newName = targetElement.textContent
    const newValue = targetElement.getAttribute('value')

    this.state = { name: newName, value: newValue, element: targetElement }

    if (fn) {
      fn()
    }

    this.handleClose()

    setTimeout(() => {
      this.dispatch('change')
    }, 0)
  }

  handleElementFocusLoss(e) {
    const { isOpen } = this.state

    if (!this.contains(e?.relatedTarget) && isOpen) {
      this.handleClose()
    }
  }

  dispatch(eventType) {
    const { value } = this.state
    const changeEvent = new CustomEvent(eventType, {
      bubbles: true,
      detail: { value },
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

    for (const slot of this.options) {
      slot.ariaSelected = slot === element
    }

    this.state = { firstRender: false }
  }
}

if (!customElements.get('list-box')) {
  customElements.define('list-box', ListBox)
}
