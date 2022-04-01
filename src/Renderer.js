import * as THREE from 'three';

import Camera from './Camera.js';
import CameraTrackingLight from './CameraTrackingLight.js';
import Stars from './Stars.js';
import Sphere from './Sphere.js';
import OrbitControls from './OrbitControls.js';
import TrackballControls from './TrackballControls.js';

export default function globe(
  element,
  texture,
  background,
  specular,
  inside,
  loadingCallback
) {
  const rotation = 15;
  const rotationSpeed = 0.0005;
  const waitTimeAfterInteraction = 10000;

  const width = element.clientWidth;
  const height = element.clientHeight;

  const scene = new THREE.Scene();
  if (inside) {
    scene.add(new THREE.AmbientLight(0xcccccc));
  } else {
    scene.add(new THREE.AmbientLight(0x333333));
  }

  const camera = new Camera({
    fov: 45,
    aspect: width / height,
    near: 0.01,
    far: 1000,
    position: [0, 0.2, 1.5],
  });
  camera.calculateFov(
    element.clientWidth,
    element.clientHeight,
    window.devicePixelRatio
  );

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(width, height);
  element.appendChild(renderer.domElement);

  const light = new CameraTrackingLight({
    camera,
    color: 0xffffff,
    intensity: 0.7,
    position: [5, 3, 5],
  });
  if (!inside) {
    scene.add(light);
  }

  const sphere = new Sphere({
    scene,
    radius: 0.5,
    segments: 128,
    texture,
    bumpMap: null,
    bumpScale: 0.0008,
    specular,
    rotation: [0, rotation, 0],
    material: {
      transparent: true,
      side: inside ? THREE.BackSide : THREE.FrontSide,
    },
    loadingCallback,
  });

  if (background) {
    scene.add(new Stars(90, 64, background));
  }

  const controls = inside
    ? new OrbitControls(camera, element)
    : new TrackballControls(camera, element);

  render();

  // ThreeJS Functions
  function render() {
    controls.update();
    // slowly rotate the globe if we haven't touched it recently
    if (
      !controls.lastTouchAt ||
      new Date() - controls.lastTouchAt > waitTimeAfterInteraction
    ) {
      sphere.rotation.y += rotationSpeed;
    }
    light.trackCamera();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  new ResizeObserver(() => {
    onResize();
  }).observe(element);
  onResize();

  function onResize() {
    camera.aspect = element.clientWidth / element.clientHeight;
    camera.calculateFov(
      element.clientWidth,
      element.clientHeight,
      window.devicePixelRatio
    );
    camera.updateProjectionMatrix();
    renderer.setSize(element.clientWidth, element.clientHeight);
  }
}
