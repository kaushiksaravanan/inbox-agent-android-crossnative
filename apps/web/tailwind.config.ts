import type { Config } from "tailwindcss";

const preset = require("@inbox/ui/tailwind-preset");

const config: Config = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [],
};

export default config;
