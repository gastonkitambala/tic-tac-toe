export default function Scoreboard({
  scores,
  playerNames,
  canStartNewGame,
  onNewGame,
  onResetScores,
}) {
  const hasScores = scores.X + scores.O + scores.draws > 0;

  return (
    <section id="scoreboard" aria-label="Scoreboard">
      <dl>
        <div>
          <dt>{playerNames.X}</dt>
          <dd>{scores.X}</dd>
        </div>
        <div>
          <dt>Draws</dt>
          <dd>{scores.draws}</dd>
        </div>
        <div>
          <dt>{playerNames.O}</dt>
          <dd>{scores.O}</dd>
        </div>
      </dl>
      <p className="scoreboard-actions">
        <button onClick={onNewGame} disabled={!canStartNewGame}>
          New game
        </button>
        <button onClick={onResetScores} disabled={!hasScores}>
          Reset scores
        </button>
      </p>
    </section>
  );
}
