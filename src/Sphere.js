import * as THREE from 'three';
import ImageLoader from './ImageLoader.js';

export default class extends THREE.Mesh {
  constructor({
    scene,
    radius,
    segments,
    texture,
    bumpMap,
    bumpScale,
    specular,
    rotation,
    material,
    loadingCallback,
  }) {
    const ctx = document.createElement('canvas').getContext('2d');
    const loader = new ImageLoader();
    // load a image resource
    loader.load(
      texture,

      image => {
        this.ctx.canvas.width = image.width;
        this.ctx.canvas.height = image.height;
        this.ctx.drawImage(image, 0, 0);

        scene.add(mesh);
      },

      loadingCallback,

      () => {
        console.error(`An error occurred loading ${texture}`);
      }
    );

    const map = new THREE.CanvasTexture(ctx.canvas);

    const mesh = super(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshPhongMaterial({
        map,
        bumpMap: bumpMap ? new THREE.TextureLoader().load(bumpMap) : null,
        bumpScale,
        specular: new THREE.Color('grey'),
        shininess: specular,
      })
    );

    mesh.ctx = ctx;
    mesh.map = map;
    mesh.loadingCallback = loadingCallback;
    mesh.rotation.fromArray(rotation);
    mesh.material.transparent = material.transparent;
    mesh.material.side = material.side;

    return mesh;
  }

  set texture(value) {
    const loader = new ImageLoader();
    loader.load(
      value,

      image => {
        this.ctx.canvas.width = image.width;
        this.ctx.canvas.height = image.height;
        this.ctx.drawImage(image, 0, 0);
        this.material.map = new THREE.CanvasTexture(this.ctx.canvas);
      },

      this.loadingCallback,

      () => {
        console.error(`An error occurred loading ${value}`);
      }
    );
  }
}
