export class ListBox extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this._state = {
      name: '',
      value: '',
      element: null,
      isOpen: false,
      placeholder: null,
    };
  }

  get state() {
    return this._state;
  }

  set state(state = {}) {
    this._state = state;
  }

  static get observedAttributes() {
    return ['is-open', 'placeholder', 'initial-value'];
  }

  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;

    if (property === 'is-open') {
      this._state.isOpen = !this._state.isOpen;
    }
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

        :host([is-open])::part(listbox) {
          display: block;
        }
      </style>

      <div part="container">
        <button part="toggle" aria-expanded="false">
          <span part="toggle-value"></span>
          <slot class="listbox-toggle-icon" name="listbox-toggle-icon" part="toggle-icon"></slot>
        </button>
        <div part="listbox">
          <div role="listbox" part="listbox-options">
            <slot name="listbox-option"></slot>
          </div>
        </div>
      </div>  
    `;

    this.slotted = [...this.querySelectorAll('[slot="listbox-option"]')];
    this.toggle = this.shadowRoot.querySelector('[part="toggle"]');
    this.toggleValue = this.shadowRoot.querySelector('[part="toggle-value"]');

    this.setInitialState();

    const { name, isOpen, element, placeholder } = this._state;

    for (const option of this.slotted) {
      option.setAttribute('tabindex', '0');
      option.setAttribute('role', 'option');

      option.addEventListener('click', this.setState.bind(this));
    }

    if (placeholder) {
      this.toggleValue.textContent = placeholder;
    } else {
      this.toggleValue.textContent = name;
    }

    this.setCurrentElementAttributes(element);

    if (isOpen) this.handleOpen();

    this.toggle.addEventListener('click', this.handleToggle.bind(this));
    this.shadowRoot.addEventListener('keydown', this.handleKeys.bind(this));
    this.addEventListener('focusout', this.handleElementFocusLoss.bind(this));
  }

  disconnectedCallback() {
    for (const option of this.slotted) {
      option.removeEventListener('click', this.setState.bind(this));
    }

    this.toggle.removeEventListener('click', this.handleToggle.bind(this));
    this.shadowRoot.removeEventListener('keydown', this.handleKeys.bind(this));
    this.removeEventListener('focusout', this.handleElementFocusLoss.bind(this));
  }

  setInitialState() {
    const initialValue = this.getAttribute('initial-value');
    const placeholder = this.getAttribute('placeholder');

    const defaultState = {
      name: this.slotted[0].textContent,
      value: this.slotted[0].getAttribute('value'),
      element: this.slotted[0],
      isOpen: false,
      placeholder: null,
    };

    if (initialValue) {
      const option = this.slotted.find(option => {
        return option.textContent === initialValue || option.getAttribute('value') === initialValue;
      });

      if (option) {
        this._state = {
          name: option.textContent,
          value: option.getAttribute('value'),
          element: option,
          isOpen: false,
          placeholder: null,
        };
      } else {
        this._state = defaultState;
      }
    } else {
      this._state = defaultState;
    }

    if (placeholder) {
      this._state.placeholder = placeholder;
    }
  }

  handleToggle() {
    const { isOpen } = this._state;

    isOpen ? this.handleClose() : this.handleOpen();
  }

  handleOpen() {
    const { element } = this._state;

    this.setAttribute('is-open', '');
    this.toggle.setAttribute('aria-expanded', 'true');
    element.focus();
  }

  handleClose() {
    this.removeAttribute('is-open');
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.focus();
  }

  handleKeys(e) {
    const { isOpen } = this._state;

    if (!isOpen) return;

    e.preventDefault();

    const currentElement = document.activeElement;

    switch (e.key) {
      case ' ':
        this.setState(e);
        return;
      case 'Escape':
        this.handleClose();
        return;
      case 'Tab':
        this.handleClose();
        return;
      case 'ArrowUp':
        if (currentElement === this.slotted[0]) return;
        currentElement.previousElementSibling.focus();
        return;
      case 'ArrowDown':
        if (currentElement === this.slotted[this.slotted.length - 1]) return;
        currentElement.nextElementSibling.focus();
        return;
    }
  }

  setState(e) {
    const option = e.target.closest('[slot="listbox-option"]');

    this._state.name = option.textContent;
    this._state.value = option.getAttribute('value');
    this._state.element = option;

    const { name, value, element } = this._state;

    const changeEvent = new CustomEvent('change', {
      bubbles: true,
      detail: { value: value },
    });

    this.toggleValue.textContent = name;
    this.dispatchEvent(changeEvent);
    this.setCurrentElementAttributes(element);
    this.handleClose();
  }

  setCurrentElementAttributes(element) {
    for (const option of this.slotted) {
      if (option === element) {
        option.setAttribute('aria-selected', 'true');
      } else {
        option.setAttribute('aria-selected', 'false');
      }
    }
  }

  handleElementFocusLoss(e) {
    const { isOpen } = this._state;

    if (!this.contains(e.relatedTarget)) {
      this.handleClose();
    }
  }
}

if (!customElements.get('list-box')) {
  customElements.define('list-box', ListBox);
}
