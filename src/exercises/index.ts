import { m0 } from './modules/m0';
import { m1 } from './modules/m1';
import { m2 } from './modules/m2';
import { m3 } from './modules/m3';
import { Exercise, Module } from './types';

export const MODULES: Module[] = [m0, m1, m2, m3];

export const ALL_EXERCISES: Exercise[] = MODULES.flatMap((m) => m.exercises);

export function findExercise(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}
