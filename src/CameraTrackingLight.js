import * as THREE from 'three';

export default class extends THREE.DirectionalLight {
  constructor({ camera, color, intensity, position }) {
    super(color, intensity)
    this.position.fromArray(position);
    this.camera = camera;
  }

  trackCamera() {
    // keep light source near camera
    const p = this.camera.position;
    const q = p.clone();
    const yaxis = new THREE.Vector3(0, 1, 0);
    const angle = Math.PI / 4;
    q.applyAxisAngle(yaxis, angle);
    const zaxis = new THREE.Vector3(0, 0, 1);
    const angle2 = Math.PI / 6;
    q.applyAxisAngle(zaxis, angle2);
    this.position.copy(q);
  }
}

