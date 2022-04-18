import { html as lithtml, css as litcss } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

function css() {
  return litcss`
    :host {
      display: block;
      position: relative;
      color: var(--spinning-globe-text-color, #000);
    }
    #webgl {
      position: absolute;
      height: 100%;
      width: 100%;
      left: 0;
      top: 0;
    }

    .loading-screen {
      position: absolute;
      top: calc(50% - 15px);
      left: calc(50% - 12.5%);
      width: 25%;
      height: 30px;
      text-align: center;
      text-transform: uppercase;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      z-index: 1;
      overflow: hidden;
      box-shadow: rgba(0, 0, 0, 0.25) 0 2px 10px;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 15px;
    }

    .loading-screen__loader {
      border-top-left-radius: 15px;
      border-bottom-left-radius: 15px;
      height: 30px;
      display: inline-block;
      font-size: 10px;
      position: relative;
      text-indent: -9999em;
      background: linear-gradient(
        rgba(140, 25, 28, 1.0),
        rgba(140, 25, 28, 0.75)
      );
      color: transparent;
      max-width: 99%;
      box-sizing: border-box;
    }

    .loading-screen__loader:before {
      content: '';
      position: absolute;
      z-index: 1;
      width: 24.99%;
      height: 100%;
      left: 0;
      top: 0;
      border-radius: 15px;
      box-sizing: border-box;
    }

    @media screen and (max-width: 2600px) {
      .loading-screen {
        top: calc(50% - 5px);
        left: calc(50% - 50px);
        height: 10px;
        width: 100px;
        border-radius: 5px;
      }
      .loading-screen__loader {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        height: 10px;
      }
      .loading-screen__loader:before {
        width: 99px;
        border-radius: 5px;
      }
    }


  `;
}

function html(loading) {
  return lithtml`
    ${
      loading < 100
        ? lithtml`
      <div class="loading-screen">
        <div
          class="loading-screen__loader"
          style="${styleMap({ width: `${loading}%` })}"
        >
          Loading...
        </div>
      </div>
    `
        : ''
    }
    <div id="webgl"></div>
  `;
}

export { css, html };
