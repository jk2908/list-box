import { ListBox } from './src/ListBox';

if (!customElements.get('list-box')) {
  customElements.define('list-box', ListBox);
}