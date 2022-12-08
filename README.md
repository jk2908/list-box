### list-box custom element.

https://2908.app/list-box/demo

Select element, listen for change, read state in event detail or directly.
```
  const listBox = document.querySelector('list-box');

  listBox.addEventListener('change', e => console.log(e.detail.value));
  const value = listBox.state.value;
```

Pass `placeholder` attribute for toggle placeholder. Pass initial value for auto selecing value. If initial value doesn't match slot value attribute or text content, then it will be ignored and default to first value. If `initial-value` attribute isn't included then it defaults to first value. Add `is-open` attribute to set open on first load.
```
  // Valid
  <list-box initial-value="option-two">
    <div slot="listbox-option" value="option-one">Option one</div>
    <div slot="listbox-option" value="option-two">Option two</div>
  </list-box>

  // Defaults to option one
  <list-box initial-value="Some other value">
    <div slot="listbox-option" value="option-one">Option one</div>
    <div slot="listbox-option" value="option-two">Option two</div>
  </list-box>

  // Defaults to option one and has placeholder in toggle part
  <list-box placeholder="Select option below">
    <div slot="listbox-option" value="option-one">Option one</div>
    <div slot="listbox-option" value="option-two">Option two</div>
  </list-box>

  // Loads in open state
  <list-box is-open>
    <div slot="listbox-option" value="option-one">Option one</div>
    <div slot="listbox-option" value="option-two">Option two</div>
  </list-box>
```

// Todo styling