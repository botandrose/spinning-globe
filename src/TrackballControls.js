import * as THREE from 'three';

class TrackballControls extends THREE.EventDispatcher {
  constructor(object, domElement) {
    super();
    const _this = this;
    const STATE = {
      NONE: -1,
      ROTATE: 0,
      ZOOM: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_ZOOM: 4,
      TOUCH_PAN: 5,
    };

    this.object = object;
    this.domElement = domElement ?? document;

    // API

    this.enabled = true;

    this.lastTouchAt = null;

    this.screen = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 };
    this.radius = (this.screen.width + this.screen.height) / 4;

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 0.5;
    this.panSpeed = 0.1;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.5;

    this.minDistance = 0.8;
    this.maxDistance = 10;

    this.keys = [65 /* A */, 83 /* S */, 68 /* D */];

    // internals

    this.target = new THREE.Vector3();

    const lastPosition = new THREE.Vector3();

    let _state = STATE.NONE;
    let _prevState = STATE.NONE;

    const _eye = new THREE.Vector3();

    let _rotateStart = new THREE.Vector3();
    let _rotateEnd = new THREE.Vector3();

    let _zoomStart = new THREE.Vector2();
    let _zoomEnd = new THREE.Vector2();

    let _touchZoomDistanceStart = 0;
    let _touchZoomDistanceEnd = 0;

    let _panStart = new THREE.Vector2();
    let _panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    const changeEvent = { type: 'change' };

    // methods

    this.handleResize = function () {
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;

      this.screen.offsetLeft = 0;
      this.screen.offsetTop = 0;

      this.radius = (this.screen.width + this.screen.height) / 4;
    };

    this.handleEvent = function (event) {
      if (typeof this[event.type] === 'function') {
        this[event.type](event);
      }
    };

    this.getMouseOnScreen = function (clientX, clientY) {
      return new THREE.Vector2(
        ((clientX - _this.screen.offsetLeft) / _this.radius) * 0.5,
        ((clientY - _this.screen.offsetTop) / _this.radius) * 0.5
      );
    };

    this.getMouseProjectionOnBall = function (clientX, clientY) {
      const mouseOnBall = new THREE.Vector3(
        (clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft) /
          _this.radius,
        (_this.screen.height * 0.5 + _this.screen.offsetTop - clientY) /
          _this.radius,
        0.0
      );

      const length = mouseOnBall.length();

      if (length > 1.0) {
        mouseOnBall.normalize();
      } else {
        mouseOnBall.z = Math.sqrt(1.0 - length * length);
      }

      _eye.copy(_this.object.position).sub(_this.target);

      const projection = _this.object.up.clone().setLength(mouseOnBall.y);
      projection.add(
        _this.object.up.clone().cross(_eye).setLength(mouseOnBall.x)
      );
      projection.add(_eye.setLength(mouseOnBall.z));

      return projection;
    };

    this.rotateCamera = function () {
      let angle = Math.acos(
        _rotateStart.dot(_rotateEnd) /
          _rotateStart.length() /
          _rotateEnd.length()
      );

      if (angle) {
        const axis = new THREE.Vector3()
          .crossVectors(_rotateStart, _rotateEnd)
          .normalize();
        const quaternion = new THREE.Quaternion();

        angle *= _this.rotateSpeed;

        quaternion.setFromAxisAngle(axis, -angle);

        _eye.applyQuaternion(quaternion);
        _this.object.up.applyQuaternion(quaternion);

        _rotateEnd.applyQuaternion(quaternion);

        if (_this.staticMoving) {
          _rotateStart.copy(_rotateEnd);
        } else {
          quaternion.setFromAxisAngle(
            axis,
            angle * (_this.dynamicDampingFactor - 1.0)
          );
          _rotateStart.applyQuaternion(quaternion);
        }
      }
    };

    this.zoomCamera = function () {
      let factor;
      if (_state === STATE.TOUCH_ZOOM) {
        factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
        _touchZoomDistanceStart = _touchZoomDistanceEnd;
        if (factor !== 1.0 && factor > 0.0) {
          this.zoomFov(factor);
        }
      } else {
        factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;
        if (factor !== 1.0 && factor > 0.0) {
          this.zoomFov(factor);

          if (_this.staticMoving) {
            _zoomStart.copy(_zoomEnd);
          } else {
            _zoomStart.y +=
              (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
          }
        }
      }
    };

    this.zoomFov = function (factor) {
      this.object.fov *= factor;
      if (this.object.fov < this.object.minFov) {
        this.object.fov = this.object.minFov;
      }
      if (this.object.fov > this.object.maxFov) {
        this.object.fov = this.object.maxFov;
      }
      this.object.updateProjectionMatrix();
    };

    this.panCamera = function () {
      const mouseChange = _panEnd.clone().sub(_panStart);
      if (mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);
        const pan = _eye
          .clone()
          .cross(_this.object.up)
          .setLength(mouseChange.x);
        pan.add(_this.object.up.clone().setLength(mouseChange.y));

        _this.object.position.add(pan);
        _this.target.add(pan);

        if (_this.staticMoving) {
          _panStart = _panEnd;
        } else {
          _panStart.add(
            mouseChange
              .subVectors(_panEnd, _panStart)
              .multiplyScalar(_this.dynamicDampingFactor)
          );
        }
      }
    };

    this.checkDistances = function () {
      if (!_this.noZoom || !_this.noPan) {
        if (
          _this.object.position.lengthSq() >
          _this.maxDistance * _this.maxDistance
        ) {
          _this.object.position.setLength(_this.maxDistance);
        }
        if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
          _this.object.position.addVectors(
            _this.target,
            _eye.setLength(_this.minDistance)
          );
        }
      }
    };

    this.update = function () {
      _eye.subVectors(_this.object.position, _this.target);
      if (!_this.noRotate) {
        _this.rotateCamera();
      }

      if (!_this.noZoom) {
        _this.zoomCamera();
      }

      if (!_this.noPan) {
        _this.panCamera();
      }

      _this.object.position.addVectors(_this.target, _eye);
      _this.checkDistances();
      _this.object.lookAt(_this.target);

      if (lastPosition.distanceToSquared(_this.object.position) > 0) {
        _this.dispatchEvent(changeEvent);
        lastPosition.copy(_this.object.position);
      }
    };

    this.reset = function () {
      _state = STATE.NONE;
      _prevState = STATE.NONE;

      _this.target.copy(_this.target0);
      _this.object.position.copy(_this.position0);
      _this.object.up.copy(_this.up0);

      _eye.subVectors(_this.object.position, _this.target);

      _this.object.lookAt(_this.target);

      _this.dispatchEvent(changeEvent);

      lastPosition.copy(_this.object.position);
    };

    // listeners

    function keydown(event) {
      if (_this.enabled === false) return;
      window.removeEventListener('keydown', keydown);
      _prevState = _state;

      if (_state !== STATE.NONE) {
        // do nothing
      } else if (
        event.keyCode === _this.keys[STATE.ROTATE] &&
        !_this.noRotate
      ) {
        _state = STATE.ROTATE;
      } else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {
        _state = STATE.ZOOM;
      } else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {
        _state = STATE.PAN;
      }
    }

    function keyup() {
      if (_this.enabled === false) return;

      _state = _prevState;
      window.addEventListener('keydown', keydown, false);
    }

    function mousedown(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      _this.lastTouchAt = new Date();

      if (_state === STATE.NONE) {
        _state = event.button;
      }

      if (_state === STATE.ROTATE && !_this.noRotate) {
        _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(
          event.clientX,
          event.clientY
        );
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomStart = _zoomEnd = _this.getMouseOnScreen(
          event.clientX,
          event.clientY
        );
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panStart = _panEnd = _this.getMouseOnScreen(
          event.clientX,
          event.clientY
        );
      }

      document.addEventListener('mousemove', mousemove, false);
      document.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      if (_state === STATE.ROTATE && !_this.noRotate) {
        _rotateEnd = _this.getMouseProjectionOnBall(
          event.clientX,
          event.clientY
        );
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomEnd = _this.getMouseOnScreen(event.clientX, event.clientY);
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panEnd = _this.getMouseOnScreen(event.clientX, event.clientY);
      }
    }

    function mouseup(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      _this.lastTouchAt = new Date();

      _state = STATE.NONE;

      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
    }

    function mousewheel(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      _this.lastTouchAt = new Date();

      let delta = 0;

      if (event.wheelDelta) {
        // WebKit / Opera / Explorer 9
        delta = event.wheelDelta / 40;
      } else if (event.detail) {
        // Firefox
        delta = -event.detail / 3;
      }
      _zoomStart.y += delta * 0.01;
    }

    function touchstart(event) {
      if (_this.enabled === false) return;

      _this.lastTouchAt = new Date();

      switch (event.touches.length) {
        case 1:
          _state = STATE.TOUCH_ROTATE;
          _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;

        case 2:
          _state = STATE.TOUCH_ZOOM;
          var dx = event.touches[0].clientX - event.touches[1].clientX;
          var dy = event.touches[0].clientY - event.touches[1].clientY;
          _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(
            dx * dx + dy * dy
          );
          break;

        case 3:
          _state = STATE.TOUCH_PAN;
          _panStart = _panEnd = _this.getMouseOnScreen(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;

        default:
          _state = STATE.NONE;
      }
    }

    function touchmove(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      _this.lastTouchAt = new Date();

      switch (event.touches.length) {
        case 1:
          _rotateEnd = _this.getMouseProjectionOnBall(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;

        case 2:
          var dx = event.touches[0].clientX - event.touches[1].clientX;
          var dy = event.touches[0].clientY - event.touches[1].clientY;
          _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
          break;

        case 3:
          _panEnd = _this.getMouseOnScreen(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;

        default:
          _state = STATE.NONE;
      }
    }

    function touchend(event) {
      if (_this.enabled === false) return;

      _this.lastTouchAt = new Date();

      switch (event.touches.length) {
        case 1:
          _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;

        case 2:
          _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
          break;

        case 3:
          _panStart = _panEnd = _this.getMouseOnScreen(
            event.touches[0].clientX,
            event.touches[0].clientY
          );
          break;
      }
      _state = STATE.NONE;
    }

    this.domElement.addEventListener(
      'contextmenu',
      event => {
        event.preventDefault();
      },
      false
    );
    this.domElement.addEventListener('mousedown', mousedown, false);
    this.domElement.addEventListener('mousewheel', mousewheel, false);
    this.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox
    this.domElement.addEventListener('touchstart', touchstart, false);
    this.domElement.addEventListener('touchend', touchend, false);
    this.domElement.addEventListener('touchmove', touchmove, false);

    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);

    this.handleResize();
  }
}

export default TrackballControls;
