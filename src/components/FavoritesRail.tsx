import { favoriteCommands } from "../lib/library";
import { useStore } from "../state/store";

export function FavoritesRail() {
  const { doc, copyCommand, selectTab } = useStore();
  const favorites = favoriteCommands(doc);

  return (
    <section className="rail-section">
      <div className="rail-hd">
        <span>Quick · Favorites</span>
        <span>{favorites.length}</span>
      </div>
      <div className="fav-list">
        {favorites.length === 0 ? (
          <p className="notes" style={{ padding: "0 8px" }}>
            Star a command to pin it here.
          </p>
        ) : (
          favorites.map(({ tab, command }) => (
            <button
              className="fav"
              key={command.id}
              type="button"
              title={`Copy filled · ${tab.name}`}
              onClick={() => void copyCommand(command, "filled")}
              onDoubleClick={() => selectTab(tab.id)}
            >
              <span className="star" aria-hidden>
                ★
              </span>
              <span>
                <strong>{command.title}</strong>
                <span>
                  {tab.name} · {command.os}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
