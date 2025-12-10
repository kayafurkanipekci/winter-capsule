import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            fontFamily: {
                // User wants everything to be 'Alice'.
                // Mapping existing classes to Alice to avoid massive refactor.
                cinzel: ["var(--font-alice)"],
                merriweather: ["var(--font-alice)"],
                // Special font for letter content
                hand: ["var(--font-courgette)"],
            },
        },
    },
    plugins: [],
};
export default config;
