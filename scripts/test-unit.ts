// Unit checks for brand removal and contact validation, plus Node ↔ PHP parity.
//   npx tsx scripts/test-unit.ts        (PHP checks are skipped when php is not installed)
import { execFileSync } from "child_process";
import path from "path";
import { debrandText } from "../server/db";
import { isValidEmail, isValidPhone } from "../server/validation";
import { csvCell } from "../src/lib/adminSession";
import { readableAccent } from "../src/lib/color";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const DEBRAND_CASES: [string, string][] = [
  ["FSIA — Forever Star India Awards", "FSIA Creators & Influencer Portal"],
  ["FOREVER STAR INDIA", "FSIA INFLUENCER"],
  ["Welcome to Forever Star India Association (FSIA)", "Welcome to FSIA Influencer"],
  ["Forever Free plan", "Always Free plan"],
  ["Stay forever young", "Stay always young"],
  ["The Forever Gala", "The Gala"],
  ["FOREVER Elite", "Elite"],
  ["fOrEvEr Icons", "Icons"],
  ["Diamonds are Forever", "Diamonds are"],
  ["Foreverstar fashion week", "star fashion week"],
  ["Nothing to change here", "Nothing to change here"]
];

for (const [input, expected] of DEBRAND_CASES) {
  const out = debrandText(input);
  check(`debrandText(${JSON.stringify(input)})`, out === expected, `got ${JSON.stringify(out)}, expected ${JSON.stringify(expected)}`);
  check(`debrandText(${JSON.stringify(input)}) has no retired word`, !/forever/i.test(out));
}

// Must match isValidPhone() in server.ts and valid_phone() in helpers.php
const PHONE_CASES: [string, boolean][] = [
  ["+91 98765 43210", true],
  ["9876543210", true],
  ["(022) 2345-6789", true],
  ["022 2345 6789 0", true],
  ["12345", false],
  ["call me maybe", false],
  ["+91 98765 43210 ext 5", false],
  ["1234567890123456", false]
];

let php = true;
try {
  execFileSync("php", ["-v"], { stdio: "ignore" });
} catch {
  php = false;
  console.log("SKIP  PHP parity checks (php not installed)");
}

if (php) {
  const helpers = path.join(process.cwd(), "php-backend/api/lib/helpers.php");
  const runPhp = (code: string, input: unknown) =>
    execFileSync("php", ["-r", `require ${JSON.stringify(helpers)}; $in = json_decode(stream_get_contents(STDIN), true); ${code}`], {
      input: JSON.stringify(input)
    }).toString();

  const phpDebrand = JSON.parse(runPhp("echo json_encode(array_map('debrand_text', $in), JSON_UNESCAPED_UNICODE);", DEBRAND_CASES.map((c) => c[0])));
  DEBRAND_CASES.forEach(([input], i) =>
    check(`PHP debrand_text matches Node for ${JSON.stringify(input)}`, phpDebrand[i] === debrandText(input), `PHP: ${JSON.stringify(phpDebrand[i])}`)
  );

  const phpPhones = JSON.parse(runPhp("echo json_encode(array_map('valid_phone', $in));", PHONE_CASES.map((c) => c[0])));
  PHONE_CASES.forEach(([input, expected], i) =>
    check(`PHP valid_phone(${JSON.stringify(input)}) is ${expected}`, phpPhones[i] === expected, `got ${phpPhones[i]}`)
  );
}

PHONE_CASES.forEach(([input, expected]) => check(`isValidPhone(${JSON.stringify(input)}) is ${expected}`, isValidPhone(input) === expected));
for (const [input, expected] of [["creator@example.com", true], [" brand@example.in ", true], ["no-at-sign.com", false], ["a@b", false]] as const) {
  check(`isValidEmail(${JSON.stringify(input)}) is ${expected}`, isValidEmail(input) === expected);
}

// Admin CSV exports must not let form input run as a spreadsheet formula
for (const [input, expected] of [
  ['=HYPERLINK("http://evil.example","x")', `"'=HYPERLINK(""http://evil.example"",""x"")"`],
  ["+91 98765 43210", "'+91 98765 43210"],
  ["@SUM(A1)", "'@SUM(A1)"],
  ["-2+3", "'-2+3"],
  ["Plain, text", '"Plain, text"'],
  ["Priya Sharma", "Priya Sharma"]
] as const) {
  check(`csvCell(${JSON.stringify(input)}) is safe`, csvCell(input) === expected, `got ${csvCell(input)}`);
}

// Admin accent colours must stay readable on the dark bars (≥ 4.5:1 against #333, the lightest dark surface)
const lum = (hex: string) => {
  const ch = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
for (const input of ["#2f2a23", "#000000", "#E1C699", "#123", "not-a-colour", ""]) {
  const out = readableAccent(input);
  const ratio = (lum(out) + 0.05) / (lum("#333333") + 0.05);
  check(`readableAccent(${JSON.stringify(input)}) = ${out} reads on #333 (${ratio.toFixed(2)}:1)`, ratio >= 4.5);
}
check("readableAccent keeps an already-readable colour unchanged", readableAccent("#E1C699").toLowerCase() === "#e1c699");

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll unit checks passed.");
process.exit(failures ? 1 : 0);
