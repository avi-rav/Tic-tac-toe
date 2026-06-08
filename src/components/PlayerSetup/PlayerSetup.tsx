import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PLAYERS } from '../../game/constants';
import { playerSchema, type PlayerFormValues } from '../../game/playerSchema';
import type { Opponent, Players } from '../../game/types';
import styles from './PlayerSetup.module.css';

interface PlayerSetupProps {
  /** Called with the validated player names and the chosen opponent on submit. */
  onStart: (players: Players, opponent: Opponent) => void;
}

const [PLAYER_X, PLAYER_O] = PLAYERS;

/** The O player's display name when playing against the computer. */
const COMPUTER_NAME = 'Computer';

/**
 * Schema-driven setup — the React equivalent of an Angular reactive form. Collects the
 * human's name and, depending on the chosen mode, either a second human name or an AI
 * difficulty. Validation lives entirely in `playerSchema`; this component only gathers
 * valid input and hands it off via `onStart`, knowing nothing about what happens next
 * (Single Responsibility / Dependency Inversion).
 */
export function PlayerSetup({ onStart }: PlayerSetupProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    mode: 'onTouched',
    defaultValues: {
      mode: 'two-players',
      playerX: '',
      playerO: '',
    } as PlayerFormValues,
  });

  const mode = watch('mode');
  const vsComputer = mode === 'vs-computer';

  // `errors` is typed against the discriminated union, so `playerO` only appears in the
  // two-players branch. This narrows it for the two-players-only field below.
  const playerOError =
    'playerO' in errors ? errors.playerO : undefined;

  const submit = handleSubmit((values) => {
    if (values.mode === 'vs-computer') {
      onStart(
        { [PLAYER_X]: values.playerX.trim(), [PLAYER_O]: COMPUTER_NAME } as Players,
        { kind: 'ai', difficulty: values.difficulty },
      );
    } else {
      onStart(
        {
          [PLAYER_X]: values.playerX.trim(),
          [PLAYER_O]: values.playerO.trim(),
        } as Players,
        { kind: 'human' },
      );
    }
  });

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={styles.title}>Tic-Tac-Toe</h1>
      <p className={styles.subtitle}>Choose a mode and enter player names to begin</p>

      <fieldset className={styles.field}>
        <legend className={styles.label}>Mode</legend>
        <div className={styles.modeOptions}>
          <label className={styles.radio}>
            <input type="radio" value="two-players" {...register('mode')} />
            Two Players
          </label>
          <label className={styles.radio}>
            <input type="radio" value="vs-computer" {...register('mode')} />
            vs Computer
          </label>
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="playerX" className={styles.label}>
          {vsComputer ? 'Your name' : `Player ${PLAYER_X}`}
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

      {vsComputer ? (
        <div className={styles.field}>
          <label htmlFor="difficulty" className={styles.label}>
            Difficulty
          </label>
          <select
            id="difficulty"
            className={styles.input}
            defaultValue="medium"
            {...register('difficulty')}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor="playerO" className={styles.label}>
            Player {PLAYER_O}
          </label>
          <input
            id="playerO"
            type="text"
            autoComplete="off"
            className={styles.input}
            aria-invalid={playerOError ? 'true' : 'false'}
            aria-describedby={playerOError ? 'playerO-error' : undefined}
            {...register('playerO')}
          />
          {playerOError && (
            <span id="playerO-error" role="alert" className={styles.error}>
              {playerOError.message}
            </span>
          )}
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={!isValid}>
        Start Game
      </button>
    </form>
  );
}
