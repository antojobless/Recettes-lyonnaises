import { m0 } from './modules/m0';
import { m1 } from './modules/m1';
import { m2 } from './modules/m2';
import { m3 } from './modules/m3';
import { m4 } from './modules/m4';
import { m5 } from './modules/m5';
import { m6 } from './modules/m6';
import { m7 } from './modules/m7';
import { m8 } from './modules/m8';
import { m9 } from './modules/m9';
import { m10 } from './modules/m10';
import { Exercise, Module } from './types';

export const MODULES: Module[] = [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10];

export const ALL_EXERCISES: Exercise[] = MODULES.flatMap((m) => m.exercises);

export function findExercise(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}
