const boost = require('movehub-async');
const manual = require('./states/manual');
const { stop, back, drive, turn, seek } = require('./states/ai');

class HubControl {
  constructor(deviceInfo, controlData) {
    this.hub = null;
    this.device = deviceInfo;
    this.control = controlData;
    this.prevControl = { ...this.control };

    this.states = {
      Turn: turn.bind(this),
      Drive: drive.bind(this),
      Stop: stop.bind(this),
      Back: back.bind(this),
      Manual: manual.bind(this),
      Seek: seek.bind(this)
    };

    this.currentState = this.states['Drive'];
  }

  async start() {
    this.hub = await boost.getHubAsync();
    this.device.connected = true;

    this.hub.on('error', err => {
      this.device.err = err;
    });

    this.hub.on('disconnect', () => {
      this.device.connected = false;
    });

    this.hub.on('distance', distance => {
      this.device.distance = distance;
    });

    this.hub.on('rssi', rssi => {
      this.device.rssi = rssi;
    });

    this.hub.on('port', portObject => {
      const { port, action } = portObject;
      this.device.ports[port].action = action;
    });

    this.hub.on('color', color => {
      this.device.color = color;
    });

    this.hub.on('tilt', tilt => {
      const { roll, pitch } = tilt;
      this.device.tilt.roll = roll;
      this.device.tilt.pitch = pitch;
    });

    this.hub.on('rotation', rotation => {
      const { port, angle } = rotation;
      this.device.ports[port].angle = angle;
    });

    await this.hub.ledAsync('red');
    await this.hub.ledAsync('yellow');
    await this.hub.ledAsync('green');
  }

  async disconnect() {
    if (this.device.connected) {
      await this.hub.disconnectAsync();
    }
  }

  setNextState(state) {
    this.control.driveInput = null;
    this.control.state = state;
    this.currentState = this.states[state];
  }

  update() {
    this.currentState();

    // TODO: Deep clone
    this.prevControl = { ...this.control };
    this.prevControl.tilt = { ...this.control.tilt };
    this.prevDevice = { ...this.device };
  }
}

module.exports = HubControl;