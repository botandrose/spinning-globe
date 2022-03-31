import device from "current-device";

import * as THREE from 'three';

import Camera from './Camera.js';

import BuildOrbitControls from "./OrbitControls.js";

import BuildTrackballControls from "./TrackballControls.js";

import BuildImageLoader from "./ImageLoader.js";

import Detector from "./Detector.js";

const OrbitControls = BuildOrbitControls(THREE);
const TrackballControls = BuildTrackballControls(THREE);
const ImageLoader = BuildImageLoader(THREE);

export default function globe(container, sourceSet, background, specular, inside) {
  const loresMap = sourceSet[0];
  const medresMap = sourceSet[1];
  const hiresMap = sourceSet[2];
  const isMobile = device.mobile();
  const isPretendingToBeDesktop = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isFirefox = /Firefox/.test(navigator.userAgent);

  // Params

  const rotation = 15;
  const rotationSpeed = 0.0005;
  const waitTimeAfterInteraction = 10000;

  const webglEl = container.renderRoot.querySelector("#webgl");

  const width = container.clientWidth;
  const height = container.clientHeight;

  const fullscreen = width > 1000;

  let map = fullscreen && !isMobile && !isPretendingToBeDesktop ? (hiresMap || loresMap) : (loresMap || hiresMap);
  if(fullscreen && isFirefox) { map = medresMap; }

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

  // Make camera position responsive to browser sizes
  const distance = 1.5

  function calculateFov(camera) {
    const newWidth = container.clientWidth / window.devicePixelRatio;
    const newHeight = container.clientHeight / window.devicePixelRatio;

    let fov;
    if(newHeight < newWidth) {
      fov = 42.7858 * 1.00005 ** newHeight;
      // console.log(`HEIGHT: ${newHeight} = ${fov}; ${window.devicePixelRatio}`);
    } else {
      const base = window.devicePixelRatio > 1 ? 0.9981 : 0.998832;
      fov = 147.422 * base ** newWidth;
      // console.log(`WIDTH: ${newWidth} = ${fov}; ${window.devicePixelRatio}`);
    }

    camera.fov = fov;
    camera.minFov = fov / 5.0;
    camera.maxFov = fov * 1.5;
  }

  const camera = new Camera(
    45,
    width / height,
    0.01,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 0.2;
  camera.position.z = distance;
  camera.calculateFov(container.clientWidth, container.clientHeight, window.devicePixelRatio);

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(width, height);
  webglEl.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(5, 3, 5);
  if (!inside) {
    scene.add(light);
  }

  const sphere = createSphere({
    radius: 0.5,
    segments: 128,
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

  if(background) {
    const stars = createStars(90, 64, background);
    scene.add(stars);
  }

  const controls = inside ? new OrbitControls(camera, webglEl) : new TrackballControls(camera, webglEl);

  new ResizeObserver(entries => {
    onResize();
  }).observe(container);
  onResize();

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
        // add image to canvas
        ctx.drawImage(image, 0, 0);

        scene.add(sphere);
      },

      (event) => {
        const percent = event.loaded / event.total * 100;
        container._loading = percent;
      },

      (event) => {
        console.error(`An error occurred loading ${args.map}`);
      }
    );

    // create THREE texture using the canvas
    const texture = new THREE.CanvasTexture(ctx.canvas);

    return new THREE.Mesh(
      new THREE.SphereGeometry(args.radius, args.segments, args.segments),
      new THREE.MeshPhongMaterial({
        map: texture,
        bumpMap: args.bumpMap ? new THREE.TextureLoader().load(args.bumpMap) : null,
        bumpScale: args.bumpScale,
        specular: new THREE.Color("grey"),
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

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.calculateFov(container.clientWidth, container.clientHeight, window.devicePixelRatio);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
};
