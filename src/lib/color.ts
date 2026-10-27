// The admin can choose any accent colour, but the site also uses it as text on the
// dark bars (#111 to #333) and as a badge background behind dark text. A too-dark choice is
// lightened, keeping its hue, until it reaches WCAG AA contrast (4.5:1) against #333, the lightest of them.
const DEFAULT_ACCENT = "#E1C699";

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrastWithDark = (rgb: number[]) => (luminance(rgb) + 0.05) / (luminance([51, 51, 51]) + 0.05);

export function readableAccent(value?: string): string {
  const hex = (value || "").trim().replace(/^#/, "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return DEFAULT_ACCENT;
  let rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  for (let step = 0; step < 20 && contrastWithDark(rgb) < 4.5; step++) {
    rgb = rgb.map((c) => Math.round(c + (255 - c) * 0.12));
  }
  return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
}
