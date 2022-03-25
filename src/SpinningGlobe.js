import { html, css, LitElement } from 'lit';
import globe from './globe.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        padding: 25px;
        color: var(--spinning-globe-text-color, #000);
      }
    `;
  }

  static get properties() {
    return {
      srcset: { type: String },
      background: { type: String },
      specular: { type: Number },
      fullscreen: { converter: value => ["fullscreen", "true"].includes(value) },
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
    globe(this.renderRoot, this.sourceSet, this.background, this.specular, this.fullscreen, this.inside);
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
