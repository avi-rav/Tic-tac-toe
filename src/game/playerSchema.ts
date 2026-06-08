import { z } from 'zod';

/**
 * Single source of validation truth for the player-setup form (the React analog
 * to an Angular reactive form's validators). The form's value type is *inferred*
 * from this schema, so the rules and the types can never drift apart.
 */
export const playerSchema = z
  .object({
    playerX: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),
    playerO: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),
  })
  .refine((data) => data.playerX.toLowerCase() !== data.playerO.toLowerCase(), {
    message: 'Players must have different names',
    path: ['playerO'],
  });

export type PlayerFormValues = z.infer<typeof playerSchema>;
