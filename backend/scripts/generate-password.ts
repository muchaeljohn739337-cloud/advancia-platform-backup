import crypto from "crypto";

type Options = {
  length: number;
  useLower: boolean;
  useUpper: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
  hexBytes?: number;
  urlsafe: boolean;
  help: boolean;
};

const AMBIGUOUS = new Set([..."Il1O0oS5Z2B8"]);

const DEFAULTS: Options = {
  length: 32,
  useLower: true,
  useUpper: true,
  useNumbers: true,
  useSymbols: true,
  excludeAmbiguous: true,
  urlsafe: false,
  help: false,
};

function parseArgs(argv: string[]): Options {
  const opts: Options = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-l":
      case "--length":
        opts.length = Math.max(
          8,
          Math.min(256, parseInt(argv[++i] ?? "32", 10)),
        );
        break;
      case "--no-lower":
        opts.useLower = false;
        break;
      case "--no-upper":
        opts.useUpper = false;
        break;
      case "--no-numbers":
        opts.useNumbers = false;
        break;
      case "--no-symbols":
        opts.useSymbols = false;
        break;
      case "--include-ambiguous":
        opts.excludeAmbiguous = false;
        break;
      case "--hex":
        opts.hexBytes = Math.max(
          8,
          Math.min(256, parseInt(argv[++i] ?? "32", 10)),
        );
        break;
      case "--urlsafe":
        opts.urlsafe = true;
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        break;
    }
  }
  return opts;
}

function usage() {
  console.log(
    `Secure Password Generator\n\n` +
      `Usage:\n  ts-node scripts/generate-password.ts [options]\n\n` +
      `Options:\n` +
      `  -l, --length <n>         Password length (8-256, default 32)\n` +
      `      --no-lower           Exclude lowercase letters\n` +
      `      --no-upper           Exclude uppercase letters\n` +
      `      --no-numbers         Exclude digits\n` +
      `      --no-symbols         Exclude symbols\n` +
      `      --include-ambiguous  Allow ambiguous chars (Il1O0 etc)\n` +
      `      --hex <bytes>        Output hex secret with given bytes (e.g., 32 => 64 hex chars)\n` +
      `      --urlsafe            Output URL-safe Base64 (when not using --hex)\n` +
      `  -h, --help               Show help\n\n` +
      `Examples:\n` +
      `  npm run gen:password -- --length 24\n` +
      `  npm run gen:password -- --length 48 --no-symbols\n` +
      `  npm run gen:password -- --urlsafe\n` +
      `  npm run gen:secret       # 64-byte hex secret (JWT, SESSION)\n`,
  );
}

function buildCharset(opts: Options): string {
  let charset = "";
  if (opts.useLower) charset += "abcdefghijklmnopqrstuvwxyz";
  if (opts.useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.useNumbers) charset += "0123456789";
  if (opts.useSymbols) charset += "!@#$%^&*()-_=+[]{};:,.<>?/|~";
  if (opts.excludeAmbiguous) {
    charset = [...charset].filter((c) => !AMBIGUOUS.has(c)).join("");
  }
  return charset;
}

function securePick(charset: string, length: number): string {
  const result: string[] = [];
  const max = charset.length;
  if (max === 0)
    throw new Error("Empty character set. Enable at least one category.");
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, max);
    result.push(charset[idx]);
  }
  return result.join("");
}

function toUrlSafeBase64(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);
  if (opts.help) return usage();

  if (opts.hexBytes) {
    const bytes = crypto.randomBytes(opts.hexBytes);
    console.log(bytes.toString("hex"));
    return;
  }

  const charset = buildCharset(opts);
  const pwd = securePick(charset, opts.length);
  if (opts.urlsafe) {
    const buf = Buffer.from(pwd, "utf8");
    console.log(toUrlSafeBase64(buf));
  } else {
    console.log(pwd);
  }
}

try {
  main();
} catch (err) {
  console.error("Error:", (err as Error).message);
  process.exit(1);
}
