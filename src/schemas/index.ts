import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: markdown for humans, json for machine processing");

export const LoginStatusInputSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

export const OpenCircuitInputSchema = z.object({
  target: z.string()
    .min(1)
    .max(500)
    .describe("Circuit URL, Tinkercad thing id, or 'new' to create a circuit from the dashboard"),
  response_format: ResponseFormatSchema
}).strict();

export const GetCircuitInputSchema = z.object({
  include_code: z.boolean().default(true).describe("Include Arduino sketch text"),
  include_serial: z.boolean().default(true).describe("Include serial monitor text if visible"),
  include_pins: z.boolean().default(true).describe("Include pin coordinates for each component"),
  response_format: ResponseFormatSchema
}).strict();

export const ScreenshotInputSchema = z.object({}).strict();

export const ListComponentsInputSchema = z.object({
  query: z.string().max(80).optional().describe("Optional filter such as led, arduino, resistor"),
  response_format: ResponseFormatSchema
}).strict();

export const AddComponentInputSchema = z.object({
  component: z.string()
    .min(1)
    .max(80)
    .describe("Catalog id or search text. Examples: arduino_uno_r3, led, resistor"),
  x: z.number().min(20).max(1400).default(320).describe("Drop X on the breadboard canvas, pixels from the left"),
  y: z.number().min(20).max(900).default(240).describe("Drop Y on the breadboard canvas, pixels from the top"),
  response_format: ResponseFormatSchema
}).strict();

export const MoveComponentInputSchema = z.object({
  component_id: z.string().min(1).max(120).describe("Id from tinkercad_get_circuit"),
  x: z.number().min(20).max(1400),
  y: z.number().min(20).max(900),
  response_format: ResponseFormatSchema
}).strict();

export const DeleteComponentInputSchema = z.object({
  component_id: z.string().min(1).max(120).describe("Id from tinkercad_get_circuit"),
  response_format: ResponseFormatSchema
}).strict();

export const ConnectPinsInputSchema = z.object({
  from: z.string()
    .min(1)
    .max(160)
    .describe("Source pin as componentId.pinName, e.g. arduino_uno_r3.D13 or led-1.anode"),
  to: z.string()
    .min(1)
    .max(160)
    .describe("Destination pin as componentId.pinName, e.g. led-1.anode"),
  response_format: ResponseFormatSchema
}).strict();

export const DeleteWireInputSchema = z.object({
  wire_id: z.string().min(1).max(160).describe("Wire id from tinkercad_get_circuit"),
  response_format: ResponseFormatSchema
}).strict();

export const SetAttributeInputSchema = z.object({
  component_id: z.string().min(1).max(120),
  name: z.string().min(1).max(80).describe("Inspector field, e.g. resistance, color, value"),
  value: z.string().min(1).max(80).describe("New value, e.g. 220 or red"),
  response_format: ResponseFormatSchema
}).strict();

export const GetCodeInputSchema = z.object({
  response_format: ResponseFormatSchema
}).strict();

export const SetCodeInputSchema = z.object({
  code: z.string().min(1).max(80_000).describe("Full Arduino sketch to write into the Text code panel")
}).strict();

export const StartSimulationInputSchema = z.object({}).strict();
export const StopSimulationInputSchema = z.object({}).strict();

export const ReadSerialInputSchema = z.object({
  wait_ms: z.number().int().min(0).max(20_000).default(1500).describe("How long to wait for serial output before reading"),
  response_format: ResponseFormatSchema
}).strict();

const NetlistComponentSchema = z.object({
  ref: z.string().min(1).max(40).describe("Local reference used in wires, e.g. uno or led1"),
  type: z.string().min(1).max(80).describe("Catalog id or search text"),
  x: z.number().min(20).max(1400).optional(),
  y: z.number().min(20).max(900).optional(),
  attributes: z.record(z.string(), z.string()).optional()
}).strict();

const NetlistWireSchema = z.object({
  from: z.string().min(1).max(160).describe("ref.pin, e.g. uno.D13"),
  to: z.string().min(1).max(160).describe("ref.pin, e.g. led1.anode")
}).strict();

export const BuildCircuitInputSchema = z.object({
  title: z.string().max(80).optional(),
  components: z.array(NetlistComponentSchema).min(1).max(40),
  wires: z.array(NetlistWireSchema).max(80).default([]),
  code: z.string().max(80_000).optional(),
  start_new: z.boolean().default(false).describe("If true, open a new circuit before building"),
  response_format: ResponseFormatSchema
}).strict();

export type LoginStatusInput = z.infer<typeof LoginStatusInputSchema>;
export type OpenCircuitInput = z.infer<typeof OpenCircuitInputSchema>;
export type GetCircuitInput = z.infer<typeof GetCircuitInputSchema>;
export type ListComponentsInput = z.infer<typeof ListComponentsInputSchema>;
export type AddComponentInput = z.infer<typeof AddComponentInputSchema>;
export type MoveComponentInput = z.infer<typeof MoveComponentInputSchema>;
export type DeleteComponentInput = z.infer<typeof DeleteComponentInputSchema>;
export type ConnectPinsInput = z.infer<typeof ConnectPinsInputSchema>;
export type DeleteWireInput = z.infer<typeof DeleteWireInputSchema>;
export type SetAttributeInput = z.infer<typeof SetAttributeInputSchema>;
export type GetCodeInput = z.infer<typeof GetCodeInputSchema>;
export type SetCodeInput = z.infer<typeof SetCodeInputSchema>;
export type ReadSerialInput = z.infer<typeof ReadSerialInputSchema>;
export type BuildCircuitInput = z.infer<typeof BuildCircuitInputSchema>;
