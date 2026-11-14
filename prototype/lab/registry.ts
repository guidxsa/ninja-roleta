// Lista de cenários do UI Lab. Cadastrar uma tela nova: um item numa das listas de scenarios/.
import { gate } from './scenarios/gate';
import { jornadaScenarios } from './scenarios/jornada';
import { meta } from './scenarios/meta';
import type { Scenario } from './types';

export const SCENARIOS: readonly Scenario[] = [...gate, ...jornadaScenarios, ...meta];
export const byId = new Map(SCENARIOS.map((s) => [s.id, s]));
