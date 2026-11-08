import type { CampaignDef } from '../../core/jornada/data';
import { stages } from './stages';

// Campanhas da História (docs/jornada/README.md#campanhas): cada uma é uma perspectiva com seus arcos, sobre os mesmos
// sistemas (combate, loja, relíquias, talentos). O Naruto é o dia; a História do Sasuke (a noite) está em design
// (docs/jornada/historia-sasuke.md). Shippuden entra como campanhas novas aqui, sem sistema novo.

export const campaigns: Record<string, CampaignDef> = {
  naruto: { id: 'naruto', perspective: 'naruto', time: 'day', stages },
};

/** Campanha de quem não escolhe (e das runs salvas antes das campanhas). */
export const DEFAULT_CAMPAIGN = 'naruto';
