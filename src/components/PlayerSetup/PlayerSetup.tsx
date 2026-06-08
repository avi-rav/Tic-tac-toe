import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PLAYERS } from '../../game/constants';
import { playerSchema, type PlayerFormValues } from '../../game/playerSchema';
import type { Players } from '../../game/types';
import styles from './PlayerSetup.module.css';

interface PlayerSetupProps {
  /** Called with the validated, trimmed names when the form is submitted. */
  onStart: (players: Players) => void;
}

const [PLAYER_X, PLAYER_O] = PLAYERS;

/**
 * Schema-driven name entry — the React equivalent of an Angular reactive form.
 * Validation lives entirely in `playerSchema`; this component only collects valid
 * input and hands it off via `onStart`. It deliberately knows nothing about what
 * happens next (Single Responsibility / Dependency Inversion).
 */
export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    mode: 'onTouched',
    defaultValues: { playerX: '', playerO: '' },
  });

  const submit = handleSubmit((values) => {
    onStart({
      [PLAYER_X]: values.playerX.trim(),
      [PLAYER_O]: values.playerO.trim(),
    } as Players);
  });

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={styles.title}>Tic-Tac-Toe</h1>
      <p className={styles.subtitle}>Enter player names to begin</p>

      <div className={styles.field}>
        <label htmlFor="playerX" className={styles.label}>
          Player {PLAYER_X}
        </label>
        <input
          id="playerX"
          type="text"
          autoComplete="off"
          className={styles.input}
          aria-invalid={errors.playerX ? 'true' : 'false'}
          aria-describedby={errors.playerX ? 'playerX-error' : undefined}
          {...register('playerX')}
        />
        {errors.playerX && (
          <span id="playerX-error" role="alert" className={styles.error}>
            {errors.playerX.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="playerO" className={styles.label}>
          Player {PLAYER_O}
        </label>
        <input
          id="playerO"
          type="text"
          autoComplete="off"
          className={styles.input}
          aria-invalid={errors.playerO ? 'true' : 'false'}
          aria-describedby={errors.playerO ? 'playerO-error' : undefined}
          {...register('playerO')}
        />
        {errors.playerO && (
          <span id="playerO-error" role="alert" className={styles.error}>
            {errors.playerO.message}
          </span>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={!isValid}>
        Start Game
      </button>
    </form>
  );
}
