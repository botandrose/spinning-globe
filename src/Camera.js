import { PerspectiveCamera } from 'three';

class Camera extends PerspectiveCamera {
  calculateFov(containerWidth, containerHeight, pixelRatio) {
    const width = containerWidth / pixelRatio;
    const height = containerHeight / pixelRatio;

    let fov;
    if(height < width) {
      fov = 42.7858 * 1.00005 ** height;
      // console.log(`HEIGHT: ${height} = ${fov}; ${pixelRatio}`);
    } else {
      const base = pixelRatio > 1 ? 0.9981 : 0.998832;
      fov = 147.422 * base ** width;
      // console.log(`WIDTH: ${width} = ${fov}; ${pixelRatio}`);
    }

    this.fov = fov;
    this.minFov = fov / 5.0;
    this.maxFov = fov * 1.5;
  }
}

export default Camera;
