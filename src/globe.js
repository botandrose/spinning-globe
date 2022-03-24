// import MobileDetect from "./mobile-detect.js";
import Detector from "./Detector.js";
import Vue from "https://ga.jspm.io/npm:vue@2.6.14/dist/vue.esm.browser.js";

import * as THREE from 'https://cdn.skypack.dev/three@v0.122.0';

import BuildOrbitControls from "./OrbitControls.js";
const OrbitControls = BuildOrbitControls(THREE);

import BuildTrackballControls from "./TrackballControls.js";
const TrackballControls = BuildTrackballControls(THREE);

window.process = {}

var ImageLoader = function ( manager ) {
  this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
}

Object.assign(ImageLoader.prototype, {

  load: function ( url, onLoad, onProgress, onError ) {

    var scope = this;

    var image = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'img' );
    image.onload = function () {

      image.onload = null;

      URL.revokeObjectURL( image.src );

      if ( onLoad ) onLoad( image );

      scope.manager.itemEnd( url );

    };
    image.onerror = onError;

    var loader = new THREE.FileLoader();
    loader.setPath( this.path );
    loader.setResponseType( 'blob' );
    loader.setWithCredentials( this.withCredentials );
    loader.load( url, function ( blob ) {

      image.src = URL.createObjectURL( blob );

    }, onProgress, onError );

    scope.manager.itemStart( url );

    return image;

  },

  setCrossOrigin: function ( value ) {

    this.crossOrigin = value;
    return this;

  },

  setWithCredentials: function ( value ) {

    this.withCredentials = value;
    return this;

  },

  setPath: function ( value ) {

    this.path = value;
    return this;

  }

} );


export default function(element) {
  element.querySelectorAll("[data-globe]").forEach(function(container) {
    // Get current globe slug from URL
    var globeKey = "globe";
    var hiresMap = container.getAttribute("data-globe");
    var medresMap = container.getAttribute("data-globe-medres");
    var loresMap = container.getAttribute("data-globe-lores");
    var specular = parseFloat(container.getAttribute("data-globe-specular") || 30);
    var fullscreen = container.getAttribute("data-globe-fullscreen") === "true";
    var isInside = container.getAttribute("data-globe-inside") === "true";
    var starImagePath = container.getAttribute("data-globe-background");
    // var isMobile = new MobileDetect(window.navigator.userAgent).mobile();
    // var isPretendingToBeDesktop = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // var isFirefox = /Firefox/.test(navigator.userAgent);
    // var map = fullscreen && !isMobile && !isPretendingToBeDesktop ? hiresMap : loresMap;
    // if(fullscreen && isFirefox) { map = medresMap; }
    var map = hiresMap;

    // Params

    var radius = 0.5;
    var segments = 128;
    var rotation = 15;
    var rotationSpeed = 0.0005;
    // var rotationSpeed = 0.014;
    var waitTimeAfterInteraction = 10000;

    var width = window.innerWidth;
    var height = window.innerHeight; // !fullscreen && isMobile ? 300 : window.innerHeight;

    // Globe configurations
    var globeConfigs = {
      globe: {
        name: "",
        radius: radius,
        segments: segments,
        map: map,
        bumpMap: null,
        bumpScale: 0.0008,
        specular: specular,
        content: null,
        imageUrl: null,
        artist: null,
        year: null,
        language: null,
        url: null,
      },
    };

    var element = container.querySelector("[data-globe-app]");
    var webglEl = container.querySelector("#webgl");
    // Set up Vue instance
    var vueApp = new Vue({
      el: element,
      data: {
        items: globeConfigs,
        globeKey: globeKey,
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
        toggleMoreModal: function() {
          this.$data.isMoreModalOpen = !this.$data.isMoreModalOpen;
          this.$data.isAboutModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        toggleAboutModal: function() {
          this.$data.isAboutModalOpen = !this.$data.isAboutModalOpen;
          this.$data.isMoreModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        toggleGlobeMenu: function() {
          this.$data.isGlobeMenuOpen = !this.$data.isGlobeMenuOpen;
        },
        closeModals: function() {
          this.$data.isAboutModalOpen = false;
          this.$data.isMoreModalOpen = false;
          this.$data.isGlobeMenuOpen = false;
        },
        updateLoading: function(percent) {
          this.$data.loading = percent + "%";
        },
        hideLoading: function() {
          this.$data.isLoading = false;
        }
      }
    });

    // Set up Three JS scene and objects
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage(webglEl);
      return;
    }

    var scene = new THREE.Scene();
    if (isInside) {
      scene.add(new THREE.AmbientLight(0xcccccc));
    } else {
      scene.add(new THREE.AmbientLight(0x333333));
    }

    // Make camera position responsive to browser width
    var cameraDepth = 1 / width * 10000 + (isInside ? 80 : 40);
    // if(!fullscreen && isMobile) { cameraDepth -= 20; }

    var camera = new THREE.PerspectiveCamera(
      cameraDepth,
      width / height,
      0.01,
      1000
    );
    camera.position.z = 1.5;
    camera.position.y = 0.2;
    camera.minFov = 5;
    camera.maxFov = cameraDepth;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    webglEl.appendChild(renderer.domElement);

    var light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(5, 3, 5);
    if (!isInside) {
      scene.add(light);
    }

    var spheres = createSpheres(globeConfigs);
    spheres[globeKey].rotation.y = rotation;
    spheres[globeKey].material.transparent = true;
    if (isInside) {
      spheres[globeKey].material.side = THREE.BackSide;
    }
    // scene.add(spheres[globeKey]);

    var stars = createStars(90, 64, starImagePath);
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
      var p = camera.position;
      var q = new THREE.Vector3();
      q.x = p.x;
      q.y = p.y;
      q.z = p.z;
      var yaxis = new THREE.Vector3(0, 1, 0);
      var angle = Math.PI / 4;
      q.applyAxisAngle(yaxis, angle);
      var zaxis = new THREE.Vector3(0, 0, 1);
      var angle2 = Math.PI / 6;
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
        function(image) {
          // use the image, e.g. draw part of it on a canvas
          let imgw = image.width;
          let imgh = image.height;
          // make the canvas big enough
          ctx.canvas.width = imgw;
          ctx.canvas.height = imgh;
          console.log(imgw, imgh);
          // add image to canvas
          ctx.drawImage(image, 0, 0);

          scene.add(spheres[globeKey]);
          vueApp.hideLoading();
        },

        function(event) {
          const percent = event.loaded / event.total * 100;
          vueApp.updateLoading(percent);
        },

        // onError callback
        function() {
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

      Object.keys(globeConfigs).forEach(function(slug) {
        result[slug] = createSphere(globeConfigs[slug]);
      });

      return result;
    }

    function createStars(radius, segments, starImagePath) {
      let texture = new THREE.TextureLoader().load(starImagePath);
      let material = new THREE.MeshBasicMaterial({
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
      var query = window.location.search.substring(1);
      var vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair[0] == variable) {
          return pair[1];
        }
      }
      return false;
    }

    // Animation Functions
    function trackOriginalOpacities(mesh) {
      var opacities = [],
        materials = mesh.material.materials
        ? mesh.material.materials
        : [mesh.material];
      for (var i = 0; i < materials.length; i++) {
        materials[i].transparent = true;
        opacities.push(materials[i].opacity);
      }
      mesh.userData.originalOpacities = opacities;
    }

    function fadeMesh(mesh, direction, options) {
      options = options || {};
      // set and check
      var current = { percentage: direction == 'in' ? 1 : 0 },
        // this check is used to work with normal and multi materials.
        mats = mesh.material.materials
        ? mesh.material.materials
        : [mesh.material],
        originals = mesh.userData.originalOpacities,
        easing = options.easing || TWEEN.Easing.Linear.None,
        duration = options.duration || 2000;
      // check to make sure originals exist
      if (!originals) {
        console.error(
          'Fade error: originalOpacities not defined, use trackOriginalOpacities'
        );
        return;
      }
      // tween opacity back to originals
      var tweenOpacity = new TWEEN.Tween(current)
        .to({ percentage: direction == 'in' ? 0 : 1 }, duration)
        .easing(easing)
        .onUpdate(function() {
          for (var i = 0; i < mats.length; i++) {
            mats[i].opacity = originals[i] * current.percentage;
          }
        })
        .onComplete(function() {
          if (options.callback) {
            options.callback();
          }
        });
      tweenOpacity.start();
      return tweenOpacity;
    }
  });
};
