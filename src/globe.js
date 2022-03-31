import * as THREE from 'three';

import Camera from './Camera.js';
import OrbitControls from "./OrbitControls.js";
import TrackballControls from "./TrackballControls.js";
import ImageLoader from "./ImageLoader.js";
import WebGLDetector from "./WebGLDetector.js";

export default function globe(element, texture, background, specular, inside, loadingCallback) {
  // Params
  const rotation = 15;
  const rotationSpeed = 0.0005;
  const waitTimeAfterInteraction = 10000;

  const width = element.clientWidth;
  const height = element.clientHeight;

  // Set up Three JS scene and objects
  if (!WebGLDetector.webgl) {
    WebGLDetector.addGetWebGLMessage(element);
    return;
  }

  const scene = new THREE.Scene();
  if (inside) {
    scene.add(new THREE.AmbientLight(0xcccccc));
  } else {
    scene.add(new THREE.AmbientLight(0x333333));
  }

  // Make camera position responsive to browser sizes
  const distance = 1.5;

  const camera = new Camera(
    45,
    width / height,
    0.01,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 0.2;
  camera.position.z = distance;
  camera.calculateFov(element.clientWidth, element.clientHeight, window.devicePixelRatio);

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(width, height);
  element.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(5, 3, 5);
  if (!inside) {
    scene.add(light);
  }

  const sphere = createSphere({
    radius: 0.5,
    segments: 128,
    texture,
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

  const controls = inside ? new OrbitControls(camera, element) : new TrackballControls(camera, element);

  new ResizeObserver(entries => {
    onResize();
  }).observe(element);
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
      args.texture,

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

      loadingCallback,

      (event) => {
        console.error(`An error occurred loading ${args.texture}`);
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
    camera.aspect = element.clientWidth / element.clientHeight;
    camera.calculateFov(element.clientWidth, element.clientHeight, window.devicePixelRatio);
    camera.updateProjectionMatrix();
    renderer.setSize(element.clientWidth, element.clientHeight);
  }
};
