// Browser storage that never throws. Some browsers block localStorage/sessionStorage
// (cookies blocked, strict privacy modes) and reading it then throws a SecurityError,
// which used to crash the admin page. Without storage the value lives in memory for
// this page only (the admin then signs in again after a reload).
type Kind = "local" | "session";

const memory: Record<Kind, Map<string, string>> = { local: new Map(), session: new Map() };

function store(kind: Kind): Storage | null {
  try {
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    const probe = "__fsia_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function make(kind: Kind) {
  return {
    getItem(key: string): string | null {
      const s = store(kind);
      try {
        return s ? s.getItem(key) : memory[kind].get(key) ?? null;
      } catch {
        return memory[kind].get(key) ?? null;
      }
    },
    setItem(key: string, value: string) {
      memory[kind].set(key, value);
      try {
        store(kind)?.setItem(key, value);
      } catch {
        /* storage full or blocked: the in-memory copy is used */
      }
    },
    removeItem(key: string) {
      memory[kind].delete(key);
      try {
        store(kind)?.removeItem(key);
      } catch {
        /* blocked */
      }
    }
  };
}

export const safeLocal = make("local");
export const safeSession = make("session");
