/**
 * Live blink-circuit smoke test. Requires a logged-in persistent profile.
 *
 *   npx playwright install chromium
 *   npm run e2e
 */

import { launchBrowser } from "../src/services/browser.js";
import {
  addComponent,
  connectPins,
  inspectCircuit,
  loginStatus,
  openCircuit,
  readSerial,
  setCode,
  setComponentAttribute,
  startSimulation,
  stopSimulation
} from "../src/services/editor-bridge.js";

const BLINK_SKETCH = `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("HIGH");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LOW");
  delay(1000);
}
`;

async function main(): Promise<void> {
  await launchBrowser();
  const status = await loginStatus();
  if (!status.loggedIn) {
    console.error(status.message);
    process.exit(2);
  }

  await openCircuit("new");
  await addComponent("arduino_uno_r3", 240, 240);
  await addComponent("led", 560, 240);
  await addComponent("resistor", 560, 380);

  const snapshot = await inspectCircuit();
  const led = snapshot.components.find((item) => /led/i.test(item.type) || /led/i.test(item.name));
  const resistor = snapshot.components.find((item) => /resistor/i.test(item.type) || /resistor/i.test(item.name));
  const uno = snapshot.components.find((item) => /arduino/i.test(item.type) || /arduino/i.test(item.name));

  if (led) {
    await setComponentAttribute(led.id, "color", "red");
  }
  if (resistor) {
    await setComponentAttribute(resistor.id, "resistance", "220");
  }
  if (uno && led) {
    await connectPins(`${uno.id}.D13`, `${led.id}.anode`);
  }
  if (led && resistor) {
    await connectPins(`${led.id}.cathode`, `${resistor.id}.pin1`);
  }
  if (resistor && uno) {
    await connectPins(`${resistor.id}.pin2`, `${uno.id}.GND`);
  }

  await setCode(BLINK_SKETCH);
  await startSimulation();
  const serial = await readSerial(2500);
  await stopSimulation();

  console.error(JSON.stringify({
    components: (await inspectCircuit()).components.map((item) => ({ id: item.id, name: item.name, type: item.type })),
    serial
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
