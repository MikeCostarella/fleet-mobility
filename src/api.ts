import type { Vehicle, VehicleDraft } from "./types";
import { SEED_VEHICLES } from "./data";

/* ============================================================================
   api.ts — mock REST backend for the Vehicles resource.

   Each method is async and typed exactly as a real fetch() wrapper would be,
   so swapping in a live backend means changing only the method bodies, not
   any caller. Latency and failures are simulated to exercise loading/error UI.
   ========================================================================== */

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const latency = (): number => 350 + Math.random() * 350; // 350–700ms

// Demo controls: failures default to off so the happy path is reliable.
// Flip _forceFail (via the UI toggle) to deliberately trigger error states.
let _forceFail = false;
const READ_FAIL_RATE = 0.0;
const WRITE_FAIL_RATE = 0.0;
const flaky = (rate: number): boolean => _forceFail || Math.random() < rate;

export const setForceFail = (on: boolean): void => { _forceFail = on; };
export const getForceFail = (): boolean => _forceFail;

let _store: Vehicle[] = SEED_VEHICLES.map((v) => ({ ...v }));
let _apiSeq = 1009;
const _newId = (): string => `V-${_apiSeq++}`;

export const fleetApi = {
  async list(): Promise<Vehicle[]> {
    await sleep(latency());
    if (flaky(READ_FAIL_RATE)) throw new Error("Network error: could not reach fleet service (503).");
    return _store.map((v) => ({ ...v }));
  },

  async create(data: VehicleDraft): Promise<Vehicle> {
    await sleep(latency());
    if (flaky(WRITE_FAIL_RATE)) throw new Error("Failed to create vehicle. Please retry.");
    const v: Vehicle = { ...data, id: _newId() };
    _store = [v, ..._store];
    return { ...v };
  },

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    await sleep(latency());
    if (flaky(WRITE_FAIL_RATE)) throw new Error("Failed to save changes. Please retry.");
    _store = _store.map((v) => (v.id === id ? { ...v, ...data } : v));
    const updated = _store.find((v) => v.id === id);
    if (!updated) throw new Error(`Vehicle ${id} not found.`);
    return { ...updated };
  },

  async remove(id: string): Promise<{ id: string }> {
    await sleep(latency());
    if (flaky(WRITE_FAIL_RATE)) throw new Error("Failed to delete vehicle. Please retry.");
    _store = _store.filter((v) => v.id !== id);
    return { id };
  },
};
