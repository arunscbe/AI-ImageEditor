/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Adding specific functional colors if needed, 
                // but standard tailwind palette covers most requirements.
            },
        },
    },
    plugins: [],
}
