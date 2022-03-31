import * as THREE from 'three';

export default class extends THREE.Mesh {
  constructor(radius, segments, background) {
    const texture = new THREE.TextureLoader().load(background);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      map: texture,
    });
    super(
      new THREE.SphereGeometry(radius, segments, segments),
      material,
    );
  }
}

