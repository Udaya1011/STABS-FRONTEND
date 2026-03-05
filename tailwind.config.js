/** @type {import('tailwindcss').Config} */
// trigger hmr
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fbf4f4',
                    100: '#f7e9e9',
                    200: '#ebd1d1',
                    300: '#dcbcbc',
                    400: '#c59494',
                    500: '#9e0000',
                    600: '#7d0000', // User requested dark red
                    700: '#660000',
                    800: '#510000',
                    900: '#420000',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                accent: {
                    purple: '#a855f7',
                    blue: '#3b82f6',
                    peach: '#fdba74',
                    success: '#22c55e',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                'premium-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
            borderRadius: {
                '2xl': '1.25rem',
                '3xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
