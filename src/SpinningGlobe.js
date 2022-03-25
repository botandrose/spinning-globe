import { html, css, LitElement } from 'lit';
import globe from './globe.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        color: var(--spinning-globe-text-color, #000);
      }
      #webgl {
        height: 100%;
      }
    `;
  }

  static get properties() {
    return {
      srcset: { type: String },
      background: { type: String },
      specular: { type: Number },
      inside: { converter: value => ["inside", "true"].includes(value) },
    };
  }

  constructor() {
    super();
    this.specular = 7;
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
    return html`
      <div id="element" v-cloak>
        <div class="loading-screen" v-if="isLoading">
          <div class="loading-screen__loader" v-bind:style="{ width: loading }">Loading...</div>
        </div>
      </div>
      <div id="webgl"></div>
    `;
  }
}
