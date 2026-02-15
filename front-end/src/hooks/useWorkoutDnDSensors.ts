import { useSensors, useSensor, PointerSensor, TouchSensor } from '@dnd-kit/core';

/** Shared DnD sensors for workout exercise reordering — activates after 8px movement to avoid blocking taps/clicks */
export const useWorkoutDnDSensors = () =>
  useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );
