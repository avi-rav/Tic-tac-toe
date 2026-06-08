import { useState } from 'react';
import { PlayerSetup } from './components/PlayerSetup/PlayerSetup';
import { Game } from './components/Game/Game';
import { HistoryPage } from './components/HistoryPage/HistoryPage';
import { useHistory } from './hooks/useHistory';
import type { Opponent, Players } from './game/types';
import styles from './App.module.css';

type View = 'game' | 'history';

/**
 * Top-level seam: holds the players for the session, owns the saved-game history,
 * and swaps between the setup form, the game, and the history view. Keeping these
 * transitions in one place makes the navigation easy to follow.
 */
export default function App() {
  const [players, setPlayers] = useState<Players | null>(null);
  const [opponent, setOpponent] = useState<Opponent>({ kind: 'human' });
  const [view, setView] = useState<View>('game');
  const { history, addRecord, clear } = useHistory();

  const startGame = (nextPlayers: Players, nextOpponent: Opponent) => {
    setOpponent(nextOpponent);
    setPlayers(nextPlayers);
  };

  if (view === 'history') {
    return (
      <main className={styles.app}>
        <HistoryPage
          history={history}
          onBack={() => setView('game')}
          onClear={clear}
        />
      </main>
    );
  }

  return (
    <main className={styles.app}>
      {players === null ? (
        <PlayerSetup onStart={startGame} />
      ) : (
        <Game
          players={players}
          opponent={opponent}
          onChangePlayers={() => setPlayers(null)}
          onShowHistory={() => setView('history')}
          onGameEnd={addRecord}
        />
      )}
    </main>
  );
}
