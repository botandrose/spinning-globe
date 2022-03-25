import device from "current-device";
import Vue from "vue/dist/vue.esm.browser";

import * as THREE from 'three';

import BuildOrbitControls from "./OrbitControls.js";
const OrbitControls = BuildOrbitControls(THREE);

import BuildTrackballControls from "./TrackballControls.js";
const TrackballControls = BuildTrackballControls(THREE);

import Detector from "./Detector.js";

class ImageLoader {
  constructor(manager) {
    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
  }

  load ( url, onLoad, onProgress, onError ) {
    const scope = this;

    const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
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
  }

  setCrossOrigin ( value ) {
    this.crossOrigin = value;
    return this;
  }

  setWithCredentials ( value ) {
    this.withCredentials = value;
    return this;
  }

  setPath ( value ) {
    this.path = value;
    return this;
  }
};

export default function(container, sourceSet, background, specular, fullscreen, inside) {
    // Get current globe slug from URL
    const hiresMap = sourceSet[2];
    const medresMap = sourceSet[1];
    const loresMap = sourceSet[0];
    var isMobile = device.mobile();
    var isPretendingToBeDesktop = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var map = fullscreen && !isMobile && !isPretendingToBeDesktop ? (hiresMap || loresMap) : (loresMap || hiresMap);
    if(fullscreen && isFirefox) { map = medresMap; }

    // Params

    const radius = 0.5;
    const segments = 128;
    const rotation = 15;
    const rotationSpeed = 0.0005;
    // var rotationSpeed = 0.014;
    const waitTimeAfterInteraction = 10000;

    const width = window.innerWidth;
    const height = !fullscreen && isMobile ? 300 : window.innerHeight;

    const element = container.querySelector("#element");
    const webglEl = container.querySelector("#webgl");
    // Set up Vue instance
    const vueApp = new Vue({
      el: element,
      data: {
        loading: 0,
        isLoading: true,
      },
      methods: {
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
    if (inside) {
      scene.add(new THREE.AmbientLight(0xcccccc));
    } else {
      scene.add(new THREE.AmbientLight(0x333333));
    }

    // Make camera position responsive to browser width
    const cameraDepth = 1 / width * 10000 + (inside ? 80 : 40);
    if(!fullscreen && isMobile) { cameraDepth -= 20; }

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
    if (!inside) {
      scene.add(light);
    }

    const sphere = createSphere({
      radius,
      segments,
      map,
      bumpMap: null,
      bumpScale: 0.0008,
      specular,
    });

    sphere.rotation.y = rotation;
    sphere.material.transparent = true;
    if (inside) {
      sphere.material.side = THREE.BackSide;
    }

    const stars = createStars(90, 64, background);
    scene.add(stars);

    const controls = inside ? new OrbitControls(camera, webglEl) : new TrackballControls(camera, webglEl);

    window.addEventListener('resize', onWindowResize, false);

    render();

    // ThreeJS Functions
    function render() {
      controls.update();
      // slowly rotate the globe if we haven't touched it recently
      if(!controls.lastTouchAt || new Date() - controls.lastTouchAt > waitTimeAfterInteraction) {
        sphere.rotation.y += rotationSpeed;
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

          scene.add(sphere);
          vueApp.hideLoading();
        },

        (event) => {
          const percent = event.loaded / event.total * 100;
          vueApp.updateLoading(percent);
        },

        // onError callback
        (event) => {
          console.error(`An error occurred loading ${args.map}`);
        }
      );

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


    function createStars(radius, segments, background) {
      const texture = new THREE.TextureLoader().load(background);
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
};
