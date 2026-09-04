import type { ComponentSpec } from "./types.js";

export const COMPONENT_CATALOG: ComponentSpec[] = [
  {
    id: "arduino_uno_r3",
    search: "Arduino Uno R3",
    label: "Arduino Uno R3",
    aliases: ["arduino", "uno", "arduino uno"],
    defaultPins: ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "A0", "A1", "A2", "A3", "A4", "A5", "5V", "3.3V", "GND", "VIN"]
  },
  {
    id: "led",
    search: "LED",
    label: "LED",
    aliases: ["light emitting diode"],
    defaultPins: ["anode", "cathode"]
  },
  {
    id: "resistor",
    search: "Resistor",
    label: "Resistor",
    aliases: ["r"],
    defaultPins: ["pin1", "pin2"]
  },
  {
    id: "breadboard_small",
    search: "Breadboard Small",
    label: "Small breadboard",
    aliases: ["breadboard", "mini breadboard"],
    defaultPins: ["pos", "neg"]
  },
  {
    id: "pushbutton",
    search: "Pushbutton",
    label: "Pushbutton",
    aliases: ["button", "switch"],
    defaultPins: ["pin1", "pin2"]
  },
  {
    id: "potentiometer",
    search: "Potentiometer",
    label: "Potentiometer",
    aliases: ["pot", "trimmer"],
    defaultPins: ["wiper", "pin1", "pin2"]
  },
  {
    id: "photoresistor",
    search: "Photoresistor",
    label: "Photoresistor",
    aliases: ["ldr", "light sensor"],
    defaultPins: ["pin1", "pin2"]
  },
  {
    id: "capacitor",
    search: "Capacitor",
    label: "Capacitor",
    aliases: ["cap"],
    defaultPins: ["pin1", "pin2"]
  },
  {
    id: "battery_9v",
    search: "9V Battery",
    label: "9V battery",
    aliases: ["battery", "9v"],
    defaultPins: ["positive", "negative"]
  },
  {
    id: "piezo",
    search: "Piezo",
    label: "Piezo buzzer",
    aliases: ["buzzer", "speaker"],
    defaultPins: ["pin1", "pin2"]
  },
  {
    id: "servo",
    search: "Micro Servo",
    label: "Micro servo",
    aliases: ["servo motor"],
    defaultPins: ["signal", "vcc", "gnd"]
  },
  {
    id: "ultrasonic",
    search: "Ultrasonic Distance Sensor",
    label: "Ultrasonic distance sensor",
    aliases: ["hc-sr04", "sonar"],
    defaultPins: ["vcc", "trig", "echo", "gnd"]
  },
  {
    id: "lcd_16x2",
    search: "LCD 16 x 2",
    label: "LCD 16x2",
    aliases: ["lcd", "display"],
    defaultPins: ["vss", "vdd", "vo", "rs", "rw", "e", "d4", "d5", "d6", "d7"]
  },
  {
    id: "multimeter",
    search: "Multimeter",
    label: "Multimeter",
    aliases: ["meter"],
    defaultPins: ["positive", "negative"]
  },
  {
    id: "slide_switch",
    search: "Slide Switch",
    label: "Slide switch",
    aliases: ["toggle"],
    defaultPins: ["pin1", "common", "pin2"]
  }
];

export function resolveComponent(query: string): ComponentSpec | undefined {
  const needle = query.trim().toLowerCase();
  const exact = COMPONENT_CATALOG.find((item) => {
    return (
      item.id === needle ||
      item.search.toLowerCase() === needle ||
      item.label.toLowerCase() === needle ||
      item.aliases.some((alias) => alias.toLowerCase() === needle)
    );
  });
  if (exact) {
    return exact;
  }
  return COMPONENT_CATALOG.find((item) => {
    return (
      item.search.toLowerCase().includes(needle) ||
      item.label.toLowerCase().includes(needle) ||
      item.id.includes(needle)
    );
  });
}

export function listCatalogMatches(query?: string): ComponentSpec[] {
  if (!query || query.trim() === "") {
    return COMPONENT_CATALOG;
  }
  const needle = query.trim().toLowerCase();
  return COMPONENT_CATALOG.filter((item) => {
    return (
      item.id.includes(needle) ||
      item.search.toLowerCase().includes(needle) ||
      item.label.toLowerCase().includes(needle) ||
      item.aliases.some((alias) => alias.toLowerCase().includes(needle))
    );
  });
}
