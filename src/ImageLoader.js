import * as THREE from 'three';

class ImageLoader {
  constructor(manager) {
    this.manager = manager ?? THREE.DefaultLoadingManager;
  }

  load(url, onLoad, onProgress, onError) {
    const image = document.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'img'
    );
    image.onload = () => {
      image.onload = null;
      URL.revokeObjectURL(image.src);
      if (onLoad) onLoad(image);
      this.manager.itemEnd(url);
    };
    image.onerror = onError;

    const loader = new THREE.FileLoader();
    loader.setPath(this.path);
    loader.setResponseType('blob');
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      blob => {
        image.src = URL.createObjectURL(blob);
      },
      onProgress,
      onError
    );

    this.manager.itemStart(url);

    return image;
  }

  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  setWithCredentials(value) {
    this.withCredentials = value;
    return this;
  }

  setPath(value) {
    this.path = value;
    return this;
  }
}

export default ImageLoader;
