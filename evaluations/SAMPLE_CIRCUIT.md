# Sample circuit for evaluations

Open this circuit (or rebuild it with `tinkercad_build_circuit`) before running `evaluations/tinkercad-circuits.xml`.

Title: Arduino LED Blink

Components:

- Arduino Uno R3 (`uno`)
- Red LED (`led1`)
- 220 ohm resistor (`r1`)

Wires:

- `uno.D13` to `led1.anode`
- `led1.cathode` to `r1.pin1`
- `r1.pin2` to `uno.GND`

Sketch:

```cpp
void setup() {
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
```

Catalog-only questions in the XML do not need this circuit open.
