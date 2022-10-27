export class ListBox extends HTMLElement {
  constructor() {
    super();

    this._isExpanded = false;
    this._currentValue = {
      name: '',
      value: '',
      id: '',
    };
    this._activeElement = null;
    
    this.attachShadow({ mode: 'open' });

    this.keys = e => this.handleKeys(e);
    this.tapOutside = e => this.handleTapOutside(e);
  }

  static get observedAttributes() {
    return ['is-expanded'];
  }

  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;

    if (property === 'is-expanded') {
      this._isExpanded = !this._isExpanded;
    }
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --listbox-container-inline-size: 200px;
          --listbox-toggle-padding: 10px;
          --listbox-inline-size: 100%;
          --listbox-border: 1px solid #000;
          --listbox-background: #fff;
          --listbox-inset-inline: 0;
          --listbox-option-focus-outline: 2px solid blue;
          --listbox-option-padding: 10px;
          --listbox-option-background-hover: rgb(225 225 225);

          contain: content;
          font: inherit;
          position: relative;
        }

        .listbox-container {
          inline-size: var(--listbox-container-inline-size, 200px);
          position: relative;
        }

        [data-toggle-listbox] {
          appearance: none;
          cursor: pointer;
          display: flex;
          font: inherit;
          inline-size: var(--listbox-toggle-inline-size, 100%);
          justify-content: space-between;
          padding: var(--listbox-toggle-padding, 10px);
          position: relative;
          text-align: start;
        }

        .listbox {
          background-color: var(--listbox-background, #fff);
          border: var(--listbox-border);
          display: none;
          inline-size: var(--listbox-inline-size, 100%);
          inset-inline: 0;
          position: absolute;
          z-index: 1;
        }

        :host([is-expanded]) .listbox {
          display: block;
        }

        ::slotted([slot=listbox-toggle-icon]) {
          margin-block-start: auto;
        }

        :host([is-expanded]) ::slotted([slot=listbox-toggle-icon]) {
          color: blue;
          font-weight: bold;
        }

        ::slotted([slot=listbox-option]) {
          cursor: pointer;
          padding: var(--listbox-option-padding, 10px);
        }

        ::slotted([slot=listbox-option]:hover) {
          background-color: var(--listbox-option-background-hover);
        }

        ::slotted([slot=listbox-option]:focus) {
          outline: var(--listbox-option-focus-outline);
        }
      </style>

      <div class="listbox-container">
        <button part="toggle" data-toggle-listbox>
          <span class="listbox-toggle-value"></span>
          <slot name="listbox-toggle-icon" class="listbox-toggle-icon"></slot>
        </button>
        <div class="listbox">
          <div part="listbox-options" class="listbox__options" role="listbox">
            <slot name="listbox-option"></slot>
          </div>
        </div>
      </div>  
    `;

    this.container = this.shadowRoot.querySelector('.listbox-container');
    this.toggleEl = this.shadowRoot.querySelector('[data-toggle-listbox]');
    this.toggleValue = this.shadowRoot.querySelector('.listbox-toggle-value');
    this.listbox = this.shadowRoot.querySelector('.listbox');

    [...this.options] = this.querySelectorAll('[slot=listbox-option]');
    this.firstOption = this.options[0];

    const createUniqueId = () => Math.ceil(new Date().getTime() * Math.random() * 100000);

    this.setAttribute('data-listbox', createUniqueId());

    this.options.forEach(option => {
      const name = option.textContent;
      const value = option.textContent;

      option.classList.add('listbox__option');
      option.innerHTML = name;
      option.setAttribute('value', value);
      option.setAttribute('data-listbox-option', createUniqueId());
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '0');

      if (option === this.firstOption) {
        option.setAttribute('aria-selected', true);
        option.setAttribute('selected', '');
      } else {
        option.setAttribute('aria-selected', false);
        option.removeAttribute('selected');
      }

      option.addEventListener('keydown', () => this.keys);
      option.addEventListener('click', e => this.setActiveElement(e));
    });

    this._currentValue = {
      name: this.firstOption.textContent,
      value: this.firstOption.getAttribute('value'),
      id: this.firstOption.getAttribute('data-listbox-option'),
    };

    if (this._activeElement === null) {
      this._activeElement = this.firstOption;
    }

    this.toggleValue.textContent = this.firstOption.textContent;

    this.toggleEl.addEventListener('click', () => {
      this._isExpanded === false ? this.handleOpen() : this.handleClose();
    });
  }

  handleOpen() {
    this.closeOtherInstances();
    this.setAttribute('is-expanded', '');
    this.previouslyFocused = this.shadowRoot.activeElement ?? document.activeElement;
    this.toggleEl.setAttribute('aria-expanded', '');
    this._activeElement.focus();

    this.shadowRoot.addEventListener('keydown', this.keys);
    document.addEventListener('click', this.tapOutside);
  }

  handleClose() {
    this.removeAttribute('is-expanded');
    this.toggleEl.removeAttribute('aria-expanded');
    this.previouslyFocused.focus();

    this.shadowRoot.removeEventListener('keydown', this.keys);
    document.removeEventListener('click', this.tapOutside);
  }

  handleKeys(e) {
    let current = document.activeElement;
    let previous = current.previousElementSibling;
    let next = current.nextElementSibling;

    switch (e.key) {
      case 'Escape':
        this.close();
        break;

      case 'Tab':
        e.preventDefault();
        this.close();
        break;

      case ' ':
        this.setActive(e);
        break;

      case 'ArrowUp':
        e.preventDefault();

        if (current === this.options[0]) {
          return;
        }

        previous.focus();
        break;
        
      case 'ArrowDown':
        e.preventDefault();

        if (current === this.options[this.options.length - 1]) {
          return;
        }

        next.focus();
        break;
    }
  }

  handleTapOutside(e) {
    if (!e.target.closest('list-box')) this.handleClose();
  }

  setActiveElement(e) {
    this._activeElement = e.target.closest('.listbox__option') ?? this.firstOption;
    this.setCurrentValue(this._activeElement);

    this.options.forEach(option => {
      if (this._activeElement === option) {
        option.setAttribute('aria-selected', true);
        option.setAttribute('selected', '');
      } else {
        option.setAttribute('aria-selected', false);
        option.removeAttribute('selected');
      }
    });
  }

  setCurrentValue(el) {
    this._currentValue = {
      name: el.textContent,
      value: el.getAttribute('value'),
      id: el.getAttribute('data-listbox-option'),
    };

    this.dispatchEvent(new Event('change', { 
      bubbles: true,
    }));

    this.toggleValue.textContent = this._currentValue.name;
    this.handleClose();
  }

  closeOtherInstances() {
    const [...els] = document.querySelectorAll('list-box');

    for (const el of els) {
      if (el !== this && el._isExpanded === true) {
        el.handleClose();
      }
    }
  }
}
