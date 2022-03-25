import { html, css, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import globe from './globe.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        color: var(--spinning-globe-text-color, #000);
      }
      #webgl {
        position: relative;
        height: 100%;
        // canvas
        //   height: auto !important
        //   max-width: 100%
      }
      #element {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        z-index: 1;
        position: static !important;
      }

      .loading-screen {
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(50% - 100px);
        right: 0;
        width: 200px;
        height: 100%;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        z-index: 1;
      }

      .globe .loading-screen {
        height: 100vh;
      }

      .loading-screen__loader {
        border-radius: 5px,
        height: 10px,
        display: inline-block,
        font-size: 10px,
        position: relative,
        text-indent: -9999em,
        background: #76A3A3,
        max-width: 95%,
      }

      .loading-screen__loader:before {
        content: "";
        position: absolute;
        z-index: 1;
        border: 1px solid rgba(#fff, 0.4);
        width: 199px;
        height: calc(100% - 1px);
        left: 0;
        top: 0;
        border-radius: 5px;
      }
    `;
  }

  static properties = {
    srcset: { type: String },
    background: { type: String },
    specular: { type: Number },
    inside: { converter: value => ["inside", "true"].includes(value) },
    _loading: { state: true },
  }

  constructor() {
    super();
    this.specular = 7;
    this._loading = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this.sourceSet = this.__parseSrcset()
  }

  __parseSrcset() {
    return this.srcset.split(",")
      .map(line => line.match(/([^ ]+) ([^, ]+)/)?.[1])
      .filter(a => a)
  }

  firstUpdated() {
    super.firstUpdated();
    globe(this, this.sourceSet, this.background, this.specular, this.inside);
  }

  render() {
    console.log('rendering');
    console.log(this._loading);
    return html`
      <div id="element">
        ${this._loading < 100 ? html`
          <div class="loading-screen">
            <div class="loading-screen__loader" style="${styleMap({ width: this._loading + '%' })}">Loading...</div>
          </div>
        ` : ''}
      </div>
      <div id="webgl"></div>
    `;
  }
}
