/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#e20b0b',
                    secondary: '#ff0000',
                    dark: '#121212',
                    darker: '#000000',
                    light: '#ffffff',
                    accent: '#a40101',
                },
                text: {
                    primary: '#545454',
                    secondary: '#5f6973',
                    tertiary: '#737373',
                    light: '#ffffff',
                },
            },
            fontFamily: {
                sans: ['Rubik', 'sans-serif'],
                heading: ['Montserrat', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
