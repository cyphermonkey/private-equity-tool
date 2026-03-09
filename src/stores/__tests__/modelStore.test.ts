import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as lboModule from '../../engine/lbo';

// Import store AFTER setting up spy to capture module-level calls
// We re-import fresh each time using dynamic imports

describe('modelStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset store between tests by re-importing
    vi.resetModules();
  });

  it('defaults activeScenario to base', async () => {
    const { useModelStore } = await import('../modelStore');
    const state = useModelStore.getState();
    expect(state.activeScenario).toBe('base');
  });

  it('initial outputs are null for all three scenarios', async () => {
    const { useModelStore } = await import('../modelStore');
    const state = useModelStore.getState();
    expect(state.outputs.base).toBeNull();
    expect(state.outputs.bull).toBeNull();
    expect(state.outputs.bear).toBeNull();
  });

  it('SCEN-01: setActiveScenario does not invoke computeLBO', async () => {
    const spy = vi.spyOn(lboModule, 'computeLBO');
    const { useModelStore } = await import('../modelStore');
    useModelStore.getState().setActiveScenario('bull');
    expect(spy).not.toHaveBeenCalled();
    expect(useModelStore.getState().activeScenario).toBe('bull');
  });

  it('SCEN-02: setAssumption produces non-null outputs for all three scenarios', async () => {
    const { useModelStore } = await import('../modelStore');
    useModelStore.getState().setAssumption('base', 'exitMultiple', '12');
    const outputs = useModelStore.getState().outputs;
    expect(outputs.base).not.toBeNull();
    expect(outputs.bull).not.toBeNull();
    expect(outputs.bear).not.toBeNull();
  });

  it('SCEN-03: changing bull exitMultiple does not affect base or bear exitEV', async () => {
    const { useModelStore } = await import('../modelStore');

    // First compute base state
    useModelStore.getState().setAssumption('base', 'exitMultiple', '12');
    const baseExitEV = useModelStore.getState().outputs.base?.exitEV;
    const bearExitEV = useModelStore.getState().outputs.bear?.exitEV;

    // Change bull exitMultiple
    useModelStore.getState().setAssumption('bull', 'exitMultiple', '15');

    // base and bear should remain the same (their assumptions didn't change)
    expect(useModelStore.getState().outputs.base?.exitEV).toBe(baseExitEV);
    expect(useModelStore.getState().outputs.bear?.exitEV).toBe(bearExitEV);

    // bull should have different (higher) exitEV
    expect(useModelStore.getState().outputs.bull?.exitEV).not.toBe(baseExitEV);
  });

  it('setAssumption computes outputs for all three scenarios (verifies via state)', async () => {
    const { useModelStore } = await import('../modelStore');
    // Initially all null
    expect(useModelStore.getState().outputs.base).toBeNull();
    expect(useModelStore.getState().outputs.bull).toBeNull();
    expect(useModelStore.getState().outputs.bear).toBeNull();
    // After setAssumption, all three should be computed (non-null with valid fields)
    useModelStore.getState().setAssumption('base', 'exitMultiple', '12');
    const outputs = useModelStore.getState().outputs;
    expect(outputs.base).not.toBeNull();
    expect(outputs.bull).not.toBeNull();
    expect(outputs.bear).not.toBeNull();
    // All three should have irr and moic fields (confirming computeLBO ran for each)
    expect(outputs.base?.irr).toBeDefined();
    expect(outputs.bull?.irr).toBeDefined();
    expect(outputs.bear?.irr).toBeDefined();
  });
});
