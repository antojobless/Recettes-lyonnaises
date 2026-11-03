import { ComponentType } from 'react';
import type { PlayerProps } from './ExercisePlayer';

/** Lecteurs des autres types d'exercices (quiz, outils, TCD), enregistrés par leurs modules. */
export const extraPlayers: Partial<Record<string, ComponentType<PlayerProps>>> = {};
