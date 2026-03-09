import { useModelStore } from '../stores/modelStore';

export function useActiveOutputs() {
  const outputs = useModelStore((s) => s.outputs);
  const activeScenario = useModelStore((s) => s.activeScenario);
  return outputs[activeScenario];
}
