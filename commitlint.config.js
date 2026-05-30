const cursorPattern =
  /\b(cursor|cursoragent@cursor\.com|made-with:\s*cursor|co-authored-by:\s*cursor)\b/i;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "no-cursor-attribution": ({ raw }) => {
          if (cursorPattern.test(raw ?? "")) {
            return [false, "commit message must not mention Cursor or Cursor attribution trailers"];
          }
          return [true];
        },
      },
    },
  ],
  rules: {
    "no-cursor-attribution": [2, "always"],
  },
};
