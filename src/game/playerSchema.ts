import { z } from 'zod';

/**
 * Single source of validation truth for the player-setup form (the React analog
 * to an Angular reactive form's validators). The form's value type is *inferred*
 * from this schema, so the rules and the types can never drift apart.
 *
 * Two modes share the form via a discriminated union on `mode`:
 *   - 'two-players' requires two distinct names (X and O).
 *   - 'vs-computer' requires only the human's (X) name plus a difficulty; O is the AI.
 */
const name = z.string().trim().min(2, 'Name must be at least 2 characters');

export const playerSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('two-players'),
      playerX: name,
      playerO: name,
    })
    .refine(
      (data) => data.playerX.toLowerCase() !== data.playerO.toLowerCase(),
      { message: 'Players must have different names', path: ['playerO'] },
    ),
  z.object({
    mode: z.literal('vs-computer'),
    playerX: name,
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }),
]);

export type PlayerFormValues = z.infer<typeof playerSchema>;
