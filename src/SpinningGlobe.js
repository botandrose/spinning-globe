import { LitElement } from 'lit';
import { css, html } from './template.js';

import globe from './globe.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css();
  }

  static properties = {
    srcset: { type: String },
    background: { type: String },
    specular: { type: Number },
    inside: { converter: value => ['inside', 'true'].includes(value) },
    _loading: { state: true },
  };

  constructor() {
    super();
    this.specular = 7;
    this._loading = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this.sourceSet = this.__parseSrcset();
  }

  __parseSrcset() {
    return this.srcset
      .split(',')
      .map(line => line.match(/([^ ]+) ([^, ]+)/)?.[1])
      .filter(a => a);
  }

  firstUpdated() {
    super.firstUpdated();
    globe(this, this.sourceSet, this.background, this.specular, this.inside);
  }

  render() {
    return html(this._loading);
  }
}
