import { useState } from "react";

export default function Player({
  name,
  defaultName,
  symbol,
  isActive,
  onChangeName,
}) {
  // Only holds a value while editing; the saved name lives in App.
  const [draftName, setDraftName] = useState(null);
  const isEditing = draftName !== null;

  function handleEditClick() {
    if (isEditing) {
      onChangeName(symbol, draftName.trim() || defaultName);
      setDraftName(null);
    } else {
      setDraftName(name);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") handleEditClick();
    if (event.key === "Escape") setDraftName(null);
  }

  return (
    <li className={isActive ? "active" : undefined}>
      <span className="player">
        {isEditing ? (
          <input
            type="text"
            required
            autoFocus
            maxLength={20}
            aria-label={`Name for player ${symbol}`}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="player-name">{name}</span>
        )}
        <span className="player-symbol">{symbol}</span>
      </span>
      <button onClick={handleEditClick}>{isEditing ? "Save" : "Edit"}</button>
    </li>
  );
}
