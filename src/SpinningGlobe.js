import { LitElement } from 'lit';
import { css, html } from './template.js';
import device from "current-device";
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
    this.texture =  this.__chooseTexture();
  }

  __parseSrcset() {
    return this.srcset
      .split(',')
      .map(line => line.match(/([^ ]+) ([^, ]+)/)?.[1])
      .filter(a => a);
  }

  __chooseTexture() {
    const loresMap = this.sourceSet[0];
    const medresMap = this.sourceSet[1];
    const hiresMap = this.sourceSet[2];
    const isMobile = device.mobile();
    const isPretendingToBeDesktop = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    const width = this.clientWidth;
    const fullscreen = width > 1000;
    let map = fullscreen && !isMobile && !isPretendingToBeDesktop ? (hiresMap || loresMap) : (loresMap || hiresMap);
    if(fullscreen && isFirefox) { map = medresMap; }
    return map;
  }

  firstUpdated() {
    super.firstUpdated();
    globe(this, this.texture, this.background, this.specular, this.inside);
  }

  render() {
    return html(this._loading);
  }
}
