# \<spinning-globe>

This webcomponent follows the [open-wc](https://github.com/open-wc/open-wc) recommendation.

## Installation

```bash
npm i spinning-globe
```

## Usage

```html
<script type="module">import 'spinning-globe';</script>

<spinning-globe srcset="texture2k.jpg 2k, texture4k.jpg 4k" background="stars.png" density="4k" specular="7" inside="false"></spinning-globe>
```

The only required attribute is at least one texture map url in src or srcset.

Or, if you want to specify the custom html tag used:

```html
<script type="module">
  import { SpinningGlobe } from 'spinning-globe/spinning-globe';
  window.customElements.define('derpy-derp', SpinningGlobe);
</script>

<derpy-derp src="texture.jpg"></derpy-derp>
```

You can also style the background of the loading bar:
```css
spinning-globe {
  --loading-bar-background: linear-gradient(rgba(140, 25, 28, 1.0), rgba(140, 25, 28, 0.75));
}
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Demoing with Storybook

To run a local instance of Storybook for your component, run

```bash
npm run storybook
```

To build a production version of Storybook, run

```bash
npm run storybook:build
```


## Tooling configs

For most of the tools, the configuration is in the `package.json` to minimize the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`
