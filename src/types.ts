export interface CircuitComponent {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pins: CircuitPin[];
  attributes: Record<string, string>;
}

export interface CircuitPin {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface CircuitWire {
  id: string;
  from: string;
  to: string;
}

export interface CircuitState {
  url: string;
  title: string;
  loggedIn: boolean;
  editorReady: boolean;
  simulationRunning: boolean;
  code: string;
  serial: string;
  components: CircuitComponent[];
  wires: CircuitWire[];
  capabilities: EditorCapabilities;
  source: "svg" | "json" | "mixed" | "empty";
}

export interface EditorCapabilities {
  hasBreadboardSvg: boolean;
  hasSerialInput: boolean;
  hasSerialSend: boolean;
  hasSerialOutput: boolean;
  hasCodeMirror: boolean;
  hasAce: boolean;
  hasMonaco: boolean;
  hasCodeTextarea: boolean;
  hasStartSimulation: boolean;
  hasStopSimulation: boolean;
  hasInspector: boolean;
  interestingGlobals: string[];
}

export interface LoginStatus {
  loggedIn: boolean;
  url: string;
  message: string;
}

export interface ComponentSpec {
  id: string;
  search: string;
  label: string;
  aliases: string[];
  defaultPins: string[];
}

export interface NetlistComponent {
  ref: string;
  type: string;
  x?: number;
  y?: number;
  attributes?: Record<string, string>;
}

export interface NetlistWire {
  from: string;
  to: string;
}

export interface CircuitNetlist {
  title?: string;
  components: NetlistComponent[];
  wires?: NetlistWire[];
  code?: string;
}

export interface ToolSuccess<T> {
  ok: true;
  data: T;
}

export interface ToolFailure {
  ok: false;
  error: string;
}
