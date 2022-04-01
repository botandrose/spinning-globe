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
        // use the image, e.g. draw part of it on a canvas
        const imgw = image.width;
        const imgh = image.height;
        // make the canvas big enough
        ctx.canvas.width = imgw;
        ctx.canvas.height = imgh;
        // add image to canvas
        ctx.drawImage(image, 0, 0);

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

    mesh.rotation.fromArray(rotation);
    mesh.material.transparent = material.transparent;
    mesh.material.side = material.side;

    return mesh;
  }
}
