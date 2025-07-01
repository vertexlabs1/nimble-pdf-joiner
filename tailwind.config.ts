
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.9',
						transform: 'scale(1.02)'
					}
				},
				'sparkle': {
					'0%, 100%': {
						opacity: '1',
						transform: 'rotate(0deg) scale(1)'
					},
					'25%': {
						opacity: '0.7',
						transform: 'rotate(90deg) scale(1.2)'
					},
					'50%': {
						opacity: '1',
						transform: 'rotate(180deg) scale(1)'
					},
					'75%': {
						opacity: '0.7',
						transform: 'rotate(270deg) scale(1.2)'
					}
				},
				'button-halo': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(234, 179, 8, 0.1)'
					},
					'50%': {
						boxShadow: '0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.2)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'bounce-attention': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-4px)'
					}
				},
				'premium-sparkle': {
					'0%, 100%': {
						opacity: '0.8',
						transform: 'rotate(0deg) scale(1)',
						filter: 'brightness(1)'
					},
					'25%': {
						opacity: '1',
						transform: 'rotate(90deg) scale(1.3)',
						filter: 'brightness(1.2)'
					},
					'50%': {
						opacity: '0.9',
						transform: 'rotate(180deg) scale(1.1)',
						filter: 'brightness(1.1)'
					},
					'75%': {
						opacity: '1',
						transform: 'rotate(270deg) scale(1.3)',
						filter: 'brightness(1.2)'
					}
				},
				'icon-glow': {
					'0%, 100%': {
						filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.3))'
					},
					'50%': {
						filter: 'drop-shadow(0 0 16px rgba(234, 179, 8, 0.6))'
					}
				},
				'page-enter': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'sparkle': 'sparkle 1.5s ease-in-out',
				'premium-sparkle': 'premium-sparkle 2s ease-in-out infinite',
				'button-halo': 'button-halo 2s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'bounce-attention': 'bounce-attention 2s ease-in-out infinite',
				'icon-glow': 'icon-glow 2s ease-in-out infinite',
				'page-enter': 'page-enter 0.6s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
