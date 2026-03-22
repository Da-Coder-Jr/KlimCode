/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace']
			},
			fontSize: {
				xxs: '0.625rem',
				smd: '0.94rem'
			},
			colors: {
				zinc: {
					750: '#323843',
					850: '#1b1f27'
				},
				surface: {
					DEFAULT: 'var(--surface)',
					secondary: 'var(--surface-secondary)',
					tertiary: 'var(--surface-tertiary)',
					hover: 'var(--surface-hover)',
					active: 'var(--surface-active)',
				},
				border: {
					DEFAULT: 'var(--border)',
					secondary: 'var(--border-secondary)',
				},
				content: {
					DEFAULT: 'var(--content)',
					secondary: 'var(--content-secondary)',
					tertiary: 'var(--content-tertiary)',
					muted: 'var(--content-muted)',
				},
				accent: {
					DEFAULT: 'var(--accent)',
					hover: 'var(--accent-hover)',
					muted: 'var(--accent-muted)',
					subtle: 'var(--accent-subtle)',
				}
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'slide-up': 'slideUp 0.3s ease-out',
				'slide-down': 'slideDown 0.2s ease-out',
				'fade-in': 'fadeIn 0.2s ease-out',
				'spin-slow': 'spin 2s linear infinite',
				'bounce-subtle': 'bounceSubtle 0.6s ease-out',
				'shimmer': 'shimmer 2s ease-in-out infinite'
			},
			keyframes: {
				slideUp: {
					'0%': { transform: 'translateY(8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				bounceSubtle: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				}
			},
			boxShadow: {
				'soft': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
				'medium': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
				'elevated': '0 10px 25px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
				'float': '0 20px 40px -8px rgb(0 0 0 / 0.12)',
			}
		}
	},
	plugins: []
};
