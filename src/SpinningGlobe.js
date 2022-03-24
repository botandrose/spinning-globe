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
      fullscreen: { type: Boolean },
      inside: { type: Boolean },
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
      .map(line => line.match(/(http[^ ]+) ([^, ]+)/)?.[0])
      .filter(a => a)
  }

  firstUpdated() {
    super.firstUpdated();
    globe(this.renderRoot);
  }

  render() {
    return html`
      <div data-globe="${this.sourceSet[0].split(" ")[0]}" data-globe-medres="${this.sourceSet[1].split(" ")[0]}" data-globe-lores="${this.sourceSet[2].split(" ")[0]}" data-globe-background="${this.background}" data-globe-specular="${this.specular}" ${this.fullscreen ? 'data-globe-fullscreen="true"' : ''}" ${this.inside ? 'data-globe-inside="true"' : ''}>
        <div data-globe-app="true" v-cloak>
          <div class="loading-screen" v-if="isLoading">
            <div class="loading-screen__loader" v-bind:style="{ width: loading }">Loading...</div>
          </div>
        </div>
        <div id="webgl"></div>
      </div>
    `;
  }
}
