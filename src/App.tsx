import { useState } from 'react';
import { PlayerSetup } from './components/PlayerSetup/PlayerSetup';
import { Game } from './components/Game/Game';
import type { Players } from './game/types';
import styles from './App.module.css';

/**
 * Top-level seam: holds the players for the session and swaps between the setup
 * form and the game. `players === null` means "not started yet". This keeps the
 * setup/play transition in one obvious place.
 */
export default function App() {
  const [players, setPlayers] = useState<Players | null>(null);

  return (
    <main className={styles.app}>
      {players === null ? (
        <PlayerSetup onStart={setPlayers} />
      ) : (
        <Game players={players} onChangePlayers={() => setPlayers(null)} />
      )}
    </main>
  );
}
