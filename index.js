const keypress = require('keypress');
const HubControl = require('./src/hub-control');
const inputs = require('./src/input-modes');

const deviceInfo = {
  ports: {
    A: { action: '', angle: 0 },
    B: { action: '', angle: 0 },
    AB: { action: '', angle: 0 },
    C: { action: '', angle: 0 },
    D: { action: '', angle: 0 },
    LED: { action: '', angle: 0 },
  },
  tilt: { roll: 0, pitch: 0 },
  distance: 0,
  rssi: 0,
  color: '',
  error: '',
  connected: false
};

const controlData = {
  input: null,
  speed: 0,
  turnAngle: 0,
  tilt: { roll: 0, pitch: 0 },
  forceState: null,
  updateInputMode: null
};

let uiUpdaterInteral = null;
let selectedInputMode = inputs.arcadeDrive;

function printUI() {
  console.log('\x1Bc');
  console.log(JSON.stringify(deviceInfo, null, 1));
  console.log(JSON.stringify(controlData, null, 1));
}

keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', async (str, key) => {
  if (!key || key.name === 'return' || key.name === 'enter') {
    return;
  } else if (key.ctrl && key.name === 'c') {
    clearInterval(uiUpdaterInteral);
    console.log('Disconnecting...');    
    await hubControl.disconnect();
    console.log('Disconnected');
    process.exit();
  } else {
    controlData.input = key.name;
    selectedInputMode(controlData);
    
    if (controlData.forceState){
      hubControl.setNextState(controlData.forceState);
      controlData.forceState = null;
    }
    if (controlData.updateInputMode){
      selectedInputMode = controlData.updateInputMode;
      controlData.updateInputMode = null;
    }
    
    printUI();
  }
});

const hubControl = new HubControl(deviceInfo, controlData);
hubControl.setNextState('Manual');
hubControl.start().then(() => {
  uiUpdaterInteral = setInterval(() => {
    printUI();
    hubControl.update();
  }, 100);
});