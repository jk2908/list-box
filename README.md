# list-box (listbox) component

[demo](https://2908.app/list-box/demo/)

Styleable listbox (select) with button trigger

## Things
  - Styleable.
  - Traps focus by making the underlying page elements [inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert) when the element is active.
  - Handles focus. Focus defaults to selected option when opening the listbox, then returns to the button upon closing. 
  - Cycling through the options via keyboard can be done using Tab (or shift + Tab) and arrow keys. Select options with Space, and close with Escape.
  - Sets the correct roles, values and ARIA attributes.
  - Dispatches an event which can listened for, to do whatever with the current value.
  - Slots for the button icon, and the listbox options.

### Styling
Most of the styling can be done by overriding these custom properties (with defaults):

```
--listbox-container-inline-size: 200px;
--listbox-toggle-padding: 10px;
--listbox-inline-size: 100%;
--listbox-border: 1px solid #000;
--listbox-background: #fff;
--listbox-inset-inline: 0;
--listbox-option-focus-outline: 2px solid blue;
--listbox-option-padding: 10px;
--listbox-option-background-hover: rgb(225 225 225);
```

For example, you could do:
```
list-box {
  --listbox-inline-size: 150%;
}
```
... to make the listbox options width, 50% larger than the toggle button (listbox container).
 
Some sections of the element can also be styled using the ::part pseudo-selector...
```
list-box::part(toggle) {
  background-color: green;
}
```
Available ::part(s) to style are (toggle) and (listbox-options). More styling can be achieved by editing ListBox.js directly.

### Slots
  - The `listbox-toggle-icon` slot means you can add your own icon on the listbox button. This doesn't animate or transform by default, but say you wanted to rotate an arrow icon when the listbox was open, you could do something like:
  ```
  [slot=listbox-toggle-icon] {
    transition: transform 125ms ease-in-out;
  }

  list-box[is-expanded] [slot=listbox-toggle-icon] {
    transform: rotate(180deg);
  }
  ```
  - Listbox options are inserted using the `listbox-option` slot. Like so, with icon:
  ```
  <list-box>
    <svg slot="listbox-toggle-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330">
      <path
        d="M325.607 79.393c-5.857-5.857-15.355-5.858-21.213.001l-139.39 139.393L25.607 79.393c-5.857-5.857-15.355-5.858-21.213.001-5.858 5.858-5.858 15.355 0 21.213l150.004 150a14.999 14.999 0 0 0 21.212-.001l149.996-150c5.859-5.857 5.859-15.355.001-21.213z" />
    </svg>
    <div slot="listbox-option">Option one</div>
    <div slot="listbox-option">Option two</div>
    <div slot="listbox-option">Option three</div>
    <div slot="listbox-option">Option four</div>
  &lt;/list-box>
  ```

### Event
Listen for a `change` event on the `list-box` element, to read the current value.
```
const listBox = document.querySelector('list-box');

setValue = () => console.log(listBox._currentValue.value);

window.addEventListener('load', setValue);

document.querySelector('list-box').addEventListener('change', e => {
  setValue();
});
```

 

