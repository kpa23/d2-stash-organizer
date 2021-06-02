// Import rollup plugins
import html from "@web/rollup-plugin-html";
import { copy } from "@web/rollup-plugin-copy";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import minifyHTML from "rollup-plugin-minify-html-literals";
import summary from "rollup-plugin-summary";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import postcss from "rollup-plugin-postcss";

const PROD = !!process.env.PROD;
const WATCH = !!process.env.ROLLUP_WATCH;

export default {
  plugins: [
    // Entry point for application build; can specify a glob to build multiple
    // HTML files for non-SPA app
    html({
      input: "src/web/index.html",
    }),
    // Resolve bare module specifiers to relative paths
    resolve(),
    json({ compact: true }),
    typescript({ tsconfig: "src/web/tsconfig.json" }),
    postcss(),
    // Minify HTML template literals
    minifyHTML(),
    // Minify JS
    PROD && terser({ ecma: 2020, module: true, warnings: true }),
    // Print bundle summary
    summary(),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ["images/**/*"],
    }),
    WATCH && serve({ contentBase: "dist", open: true }),
  ],
  output: {
    dir: "dist",
    manualChunks: {
      "game-data": ["src/game-data/index.ts", "src/game-data/strings.ts"],
    },
  },
  preserveEntrySignatures: "strict",
};
