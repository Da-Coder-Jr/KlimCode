/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				klim: {
					50: '#eef7ff',
					100: '#d9ecff',
					200: '#bce0ff',
					300: '#8ecdff',
					400: '#59b0ff',
					500: '#338dff',
					600: '#1a6cf5',
					700: '#1457e1',
					800: '#1746b6',
					900: '#193e8f',
					950: '#142757'
				},
				surface: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					750: '#283548',
					800: '#1e293b',
					850: '#172033',
					900: '#0f172a',
					950: '#020617'
				}
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Segoe UI', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace']
			},
			fontSize: {
				'2xs': ['0.625rem', { lineHeight: '0.875rem' }]
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
				'fade-in': 'fadeIn 0.2s ease-out',
				'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'spin-slow': 'spin 2s linear infinite',
				'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
				'shimmer': 'shimmer 2s linear infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow-pulse': 'glowPulse 2s ease-in-out infinite'
			},
			keyframes: {
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				glowPulse: {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '0.8' }
				}
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			boxShadow: {
				'glow-sm': '0 0 15px -3px rgba(51, 141, 255, 0.15)',
				'glow': '0 0 25px -5px rgba(51, 141, 255, 0.2)',
				'glow-lg': '0 0 40px -8px rgba(51, 141, 255, 0.3)',
				'glow-xl': '0 0 60px -10px rgba(51, 141, 255, 0.35)',
				'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
			},
			backdropBlur: {
				'xs': '2px',
			},
			borderRadius: {
				'4xl': '2rem',
			}
		}
	},
	plugins: []
};
