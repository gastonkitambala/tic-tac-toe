import { DIFFICULTIES } from "../game/ai";

const OPPONENTS = [
  { value: "human", label: "2 players" },
  { value: "computer", label: "vs Computer" },
];

const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Unbeatable" };

export default function GameModeControls({ settings, onChange }) {
  return (
    <div id="game-mode">
      <fieldset className="segmented">
        <legend className="visually-hidden">Opponent</legend>
        {OPPONENTS.map(({ value, label }) => (
          <label key={value} className={settings.opponent === value ? "selected" : undefined}>
            <input
              type="radio"
              name="opponent"
              value={value}
              checked={settings.opponent === value}
              onChange={() => onChange({ ...settings, opponent: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {settings.opponent === "computer" && (
        <fieldset className="segmented">
          <legend className="visually-hidden">Difficulty</legend>
          {DIFFICULTIES.map((difficulty) => (
            <label
              key={difficulty}
              className={settings.difficulty === difficulty ? "selected" : undefined}
            >
              <input
                type="radio"
                name="difficulty"
                value={difficulty}
                checked={settings.difficulty === difficulty}
                onChange={() => onChange({ ...settings, difficulty })}
              />
              {DIFFICULTY_LABELS[difficulty]}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
