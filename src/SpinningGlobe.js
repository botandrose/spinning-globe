import { html, css, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import globe from './globe.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        color: var(--spinning-globe-text-color, #000);
      }
      #webgl {
        position: relative;
        height: 100%;
        // canvas
        //   height: auto !important
        //   max-width: 100%
      }

      .loading-screen {
        position: absolute;
        top: calc(50% - 5px);
        left: calc(50% - 100px);
        width: 200px;
        height: 10px;
        text-align: center;
        text-transform: uppercase;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        z-index: 1;
        overflow: hidden;
        box-shadow: rgba(0, 0, 0, 0.25) 0 2px 10px;
        box-sizing: border-box;
      }

      .loading-screen__loader {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        height: 10px;
        display: inline-block;
        font-size: 10px;
        position: relative;
        text-indent: -9999em;
        background: linear-gradient(
          rgba(255, 255, 255, 0.25),
          rgba(255, 255, 255, 0.1)
        );
        color: transparent;
        max-width: 95%;
        box-sizing: border-box;
      }

      .loading-screen__loader:before {
        content: '';
        position: absolute;
        z-index: 1;
        border: 1px solid rgba(255, 255, 255, 0.15);
        width: 199px;
        height: 100%;
        left: 0;
        top: 0;
        border-radius: 5px;
        box-sizing: border-box;
      }
    `;
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
    return html`
      ${this._loading < 100
        ? html`
            <div class="loading-screen">
              <div
                class="loading-screen__loader"
                style="${styleMap({ width: this._loading + '%' })}"
              >
                Loading...
              </div>
            </div>
          `
        : ''}
      <div id="webgl"></div>
    `;
  }
}
