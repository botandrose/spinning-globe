// import MobileDetect from "./mobile-detect.js";
import Vue from "https://ga.jspm.io/npm:vue@2.6.14/dist/vue.esm.browser.js";

import * as THREE from 'https://cdn.skypack.dev/three@v0.122.0';
import Detector from "./Detector.js";

import BuildOrbitControls from "./OrbitControls.js";

import BuildTrackballControls from "./TrackballControls.js";

const OrbitControls = BuildOrbitControls(THREE);
const TrackballControls = BuildTrackballControls(THREE);

window.process = {}

const ImageLoader = function ( manager ) {
  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
}

Object.assign(ImageLoader.prototype, {

  load ( url, onLoad, onProgress, onError ) {

    const scope = this;

    const image = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'img' );
    image.onload = function () {

      image.onload = null;

      URL.revokeObjectURL( image.src );

      if ( onLoad ) onLoad( image );

      scope.manager.itemEnd( url );

    };
    image.onerror = onError;

    const loader = new THREE.FileLoader();
    loader.setPath( this.path );
    loader.setResponseType( 'blob' );
    loader.setWithCredentials( this.withCredentials );
    loader.load( url, ( blob ) => {

      image.src = URL.createObjectURL( blob );

    }, onProgress, onError );

    scope.manager.itemStart( url );

    return image;

  },

  setCrossOrigin ( value ) {

    this.crossOrigin = value;
    return this;

  },

  setWithCredentials ( value ) {

    this.withCredentials = value;
    return this;

  },

  setPath ( value ) {

    this.path = value;
    return this;

  }

} );


export default function(element) {
  element.querySelectorAll("[data-globe]").forEach((container) => {
    // Get current globe slug from URL
    const globeKey = "globe";
    const hiresMap = container.getAttribute("data-globe");
    const medresMap = container.getAttribute("data-globe-medres");
    const loresMap = container.getAttribute("data-globe-lores");
    const specular = parseFloat(container.getAttribute("data-globe-specular") || 30);
    const fullscreen = container.getAttribute("data-globe-fullscreen") === "true";
    const isInside = container.getAttribute("data-globe-inside") === "true";
    const starImagePath = container.getAttribute("data-globe-background");
    // var isMobile = new MobileDetect(window.navigator.userAgent).mobile();
    // var isPretendingToBeDesktop = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // var isFirefox = /Firefox/.test(navigator.userAgent);
    // var map = fullscreen && !isMobile && !isPretendingToBeDesktop ? hiresMap : loresMap;
    // if(fullscreen && isFirefox) { map = medresMap; }
    const map = hiresMap;

    // Params

    const radius = 0.5;
    const segments = 128;
    const rotation = 15;
    const rotationSpeed = 0.0005;
    // var rotationSpeed = 0.014;
    const waitTimeAfterInteraction = 10000;

    const width = window.innerWidth;
    const height = window.innerHeight; // !fullscreen && isMobile ? 300 : window.innerHeight;

    // Globe configurations
    const globeConfigs = {
      globe: {
        name: "",
        radius,
        segments,
        map,
        bumpMap: null,
        bumpScale: 0.0008,
        specular,
        content: null,
        imageUrl: null,
        artist: null,
        year: null,
        language: null,
        url: null,
      },
    };

    const element = container.querySelector("[data-globe-app]");
    const webglEl = container.querySelector("#webgl");
    // Set up Vue instance
    const vueApp = new Vue({
      el: element,
      data: {
        items: globeConfigs,
        globeKey,
        title: null,
        content: null,
        year: null,
        language: null,
        loading: 0,
        isLoading: true,
        isMoreModalOpen: false,
        isAboutModalOpen: false,
        isGlobeMenuOpen: false
      },
      methods: {
        toggleMoreModal() {
          this.$data.isMoreModalOpen = !this.$data.isMoreModalOpen;
          this.$data.isAboutModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        toggleAboutModal() {
          this.$data.isAboutModalOpen = !this.$data.isAboutModalOpen;
          this.$data.isMoreModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        toggleGlobeMenu() {
          this.$data.isGlobeMenuOpen = !this.$data.isGlobeMenuOpen;
        },
        closeModals() {
          this.$data.isAboutModalOpen = false;
          this.$data.isMoreModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        updateLoading(percent) {
          this.$data.loading = `${percent  }%`;
        },
        hideLoading() {
          this.$data.isLoading = false;
        }
      }
    });

    // Set up Three JS scene and objects
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage(webglEl);
      return;
    }

    const scene = new THREE.Scene();
    if (isInside) {
      scene.add(new THREE.AmbientLight(0xcccccc));
    } else {
      scene.add(new THREE.AmbientLight(0x333333));
    }

    // Make camera position responsive to browser width
    const cameraDepth = 1 / width * 10000 + (isInside ? 80 : 40);
    // if(!fullscreen && isMobile) { cameraDepth -= 20; }

    const camera = new THREE.PerspectiveCamera(
      cameraDepth,
      width / height,
      0.01,
      1000
    );
    camera.position.z = 1.5;
    camera.position.y = 0.2;
    camera.minFov = 5;
    camera.maxFov = cameraDepth;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    webglEl.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(5, 3, 5);
    if (!isInside) {
      scene.add(light);
    }

    const spheres = createSpheres(globeConfigs);
    spheres[globeKey].rotation.y = rotation;
    spheres[globeKey].material.transparent = true;
    if (isInside) {
      spheres[globeKey].material.side = THREE.BackSide;
    }
    // scene.add(spheres[globeKey]);

    const stars = createStars(90, 64, starImagePath);
    scene.add(stars);

    const controls = isInside ? new OrbitControls(camera, webglEl) : new TrackballControls(camera, webglEl);

    // window.addEventListener('resize', onWindowResize, false);

    render();

    // ThreeJS Functions
    function render() {
      controls.update();
      // slowly rotate the globe if we haven't touched it recently
      if(!controls.lastTouchAt || new Date() - controls.lastTouchAt > waitTimeAfterInteraction) {
        spheres[globeKey].rotation.y += rotationSpeed;
      }

      // keep light source near camera
      const p = camera.position;
      const q = new THREE.Vector3();
      q.x = p.x;
      q.y = p.y;
      q.z = p.z;
      const yaxis = new THREE.Vector3(0, 1, 0);
      const angle = Math.PI / 4;
      q.applyAxisAngle(yaxis, angle);
      const zaxis = new THREE.Vector3(0, 0, 1);
      const angle2 = Math.PI / 6;
      q.applyAxisAngle(zaxis, angle2);
      light.position.copy(q);

      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

    function createSphere(args) {
      const ctx = document.createElement("canvas").getContext("2d");
      const loader = new ImageLoader();
      // load a image resource
      loader.load(
        args.map,
        (image) => {
          // use the image, e.g. draw part of it on a canvas
          const imgw = image.width;
          const imgh = image.height;
          // make the canvas big enough
          ctx.canvas.width = imgw;
          ctx.canvas.height = imgh;
          console.log(imgw, imgh);
          // add image to canvas
          ctx.drawImage(image, 0, 0);

          scene.add(spheres[globeKey]);
          vueApp.hideLoading();
        },

        (event) => {
          const percent = event.loaded / event.total * 100;
          vueApp.updateLoading(percent);
        },

        // onError callback
        () => {
          console.error('An error happened.');
        }
      );

      // set the image (triggering the above onload)
      // requestCORSIfNotSameOrigin(img1, args.map);

      // create THREE texture using the canvas
      const texture = new THREE.CanvasTexture(ctx.canvas);

      // const mapLoader = new THREE.TextureLoader(); // OLD

      return new THREE.Mesh(
        new THREE.SphereGeometry(args.radius, args.segments, args.segments),

        // new THREE.MeshBasicMaterial({ // was initially using this but bumpMap and Lights broke
        new THREE.MeshPhongMaterial({
          map: texture,
          bumpMap: args.bumpMap ? new THREE.TextureLoader().load(args.bumpMap) : null,
          bumpScale: args.bumpScale,
          specular: new THREE.Color("grey"), // OLD
          shininess: args.specular,
        })
      );
    }


    function createSpheres(globeConfigs) {
      const result = {};

      Object.keys(globeConfigs).forEach((slug) => {
        result[slug] = createSphere(globeConfigs[slug]);
      });

      return result;
    }

    function createStars(radius, segments, starImagePath) {
      const texture = new THREE.TextureLoader().load(starImagePath);
      const material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: texture,
      });
      return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments),
        material,
      );
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Get query variable from URL
    function getQueryVariable(variable) {
      const query = window.location.search.substring(1);
      const vars = query.split('&');
      for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        if (pair[0] == variable) {
          return pair[1];
        }
      }
      return false;
    }

    // Animation Functions
    function trackOriginalOpacities(mesh) {
      const opacities = [];
        const materials = mesh.material.materials
        ? mesh.material.materials
        : [mesh.material];
      for (let i = 0; i < materials.length; i++) {
        materials[i].transparent = true;
        opacities.push(materials[i].opacity);
      }
      mesh.userData.originalOpacities = opacities;
    }

    function fadeMesh(mesh, direction, options) {
      options = options || {};
      // set and check
      const current = { percentage: direction == 'in' ? 1 : 0 };
        // this check is used to work with normal and multi materials.
        const mats = mesh.material.materials
        ? mesh.material.materials
        : [mesh.material];
        const originals = mesh.userData.originalOpacities;
        const easing = options.easing || TWEEN.Easing.Linear.None;
        const duration = options.duration || 2000;
      // check to make sure originals exist
      if (!originals) {
        console.error(
          'Fade error: originalOpacities not defined, use trackOriginalOpacities'
        );
        return;
      }
      // tween opacity back to originals
      const tweenOpacity = new TWEEN.Tween(current)
        .to({ percentage: direction == 'in' ? 0 : 1 }, duration)
        .easing(easing)
        .onUpdate(() => {
          for (let i = 0; i < mats.length; i++) {
            mats[i].opacity = originals[i] * current.percentage;
          }
        })
        .onComplete(() => {
          if (options.callback) {
            options.callback();
          }
        });
      tweenOpacity.start();
      return tweenOpacity;
    }
  });
};
