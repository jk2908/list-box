import { ListBox } from './src/ListBox.js';

if (!customElements.get('list-box')) {
  customElements.define('list-box', ListBox);
}