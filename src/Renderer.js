import * as THREE from 'three';

import Camera from './Camera.js';
import CameraTrackingLight from './CameraTrackingLight.js';
import Stars from './Stars.js';
import Sphere from './Sphere.js';
import OrbitControls from './OrbitControls.js';
import TrackballControls from './TrackballControls.js';

export default class {
  constructor(element, texture, background, specular, inside, loadingCallback) {
    this.element = element;
    const rotation = 15;
    this.rotationSpeed = 0.0005;
    this.waitTimeAfterInteraction = 10000;

    const width = this.element.clientWidth;
    const height = this.element.clientHeight;

    this.scene = new THREE.Scene();
    if (inside) {
      this.scene.add(new THREE.AmbientLight(0xcccccc));
    } else {
      this.scene.add(new THREE.AmbientLight(0x333333));
    }

    this.camera = new Camera({
      fov: 45,
      aspect: width / height,
      near: 0.01,
      far: 1000,
      position: [0, 0.2, 1.5],
    });
    this.camera.calculateFov(
      this.element.clientWidth,
      this.element.clientHeight,
      window.devicePixelRatio
    );

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.setSize(width, height);
    this.element.appendChild(this.renderer.domElement);

    this.light = new CameraTrackingLight({
      camera: this.camera,
      color: 0xffffff,
      intensity: 0.7,
      position: [5, 3, 5],
    });
    if (!inside) {
      this.scene.add(this.light);
    }

    this.sphere = new Sphere({
      scene: this.scene,
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
      this.scene.add(new Stars(90, 64, background));
    }

    this.controls = inside
      ? new OrbitControls(this.camera, this.element)
      : new TrackballControls(this.camera, this.element);

    this.render();

    new ResizeObserver(() => {
      this.onResize();
    }).observe(this.element);
    this.onResize();
  }

  set texture(value) {
    this.sphere.texture = value;
  }

  render() {
    this.controls.update();
    // slowly rotate the globe if we haven't touched it recently
    if (
      !this.controls.lastTouchAt ||
      new Date() - this.controls.lastTouchAt > this.waitTimeAfterInteraction
    ) {
      this.sphere.rotation.y += this.rotationSpeed;
    }
    this.light.trackCamera();
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
    this.camera.calculateFov(
      this.element.clientWidth,
      this.element.clientHeight,
      window.devicePixelRatio
    );
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
  }
}

