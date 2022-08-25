import { LitElement } from 'lit';
import { html, css } from './HtmlCss.js';
import device from 'current-device';
import WebGLDetector from './WebGLDetector.js';
import Renderer from './Renderer.js';

export class SpinningGlobe extends LitElement {
  static get styles() {
    return css();
  }

  static properties = {
    src: { type: String, reflect: true },
    srcset: { type: String },
    density: { type: String, reflect: true },
    background: { type: String },
    specular: { type: Number },
    inside: { converter: value => ['inside', 'true', ''].includes(value) },
    _loading: { state: true },
  };

  constructor() {
    super();
    this.specular = 7;
    this._loading = 0;
  }

  #density;

  get density() { return this.#density; }
  set density(value) {
    let oldValue = this.#density;
    this.#density = value;
    this.requestUpdate('density', oldValue);
    if(this.renderer) {
      this.renderer.texture = this.src = this.__chooseSrc();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.sourceSet = this.__parseSrcset();
    this.density = this.__chooseDensity();
    this.src ??= this.__chooseSrc();
  }

  __parseSrcset() {
    return (this.srcset || "")
      .split(',')
      .map(line => line.match(/([^ ]+) ([^, ]+)/))
      .filter(a => a)
      .reduce((map, match) => Object.assign(map, { [match[2]]: match[1] }), {})
  }

  __chooseDensity() {
    if(this.density) { return this.density; }
    const isMobile = device.mobile();
    const isPretendingToBeDesktop =
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.platform);

    const width = this.clientWidth;
    const fullscreen = width > 1000;
    let density =
      fullscreen && !isMobile && !isPretendingToBeDesktop
        ? "16k"
        : "4k";
    if (fullscreen && (isFirefox || isIPad)) {
      density = "8k";
    }
    return density;
  }

  __chooseSrc() {
    return this.sourceSet[this.density] || Object.values(this.sourceSet)[0];
  }

  firstUpdated() {
    super.firstUpdated();
    this.webglEl = this.renderRoot.querySelector('#webgl');
    if (!WebGLDetector.webgl) {
      this.webglEl.appendChild(WebGLDetector.getWebGLErrorMessage());
    } else {
      this.renderer = new Renderer(
        this.webglEl,
        this.src,
        this.background,
        this.specular,
        this.inside,
        event => {
          const percent = (event.loaded / event.total) * 100;
          this._loading = percent;
        }
      );
    }
  }

  render() {
    return html(this._loading);
  }
}
