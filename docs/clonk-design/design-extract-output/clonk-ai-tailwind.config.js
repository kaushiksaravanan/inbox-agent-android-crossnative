/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(15, 100%, 97%)',
            '100': 'hsl(15, 100%, 94%)',
            '200': 'hsl(15, 100%, 86%)',
            '300': 'hsl(15, 100%, 76%)',
            '400': 'hsl(15, 100%, 64%)',
            '500': 'hsl(15, 100%, 50%)',
            '600': 'hsl(15, 100%, 40%)',
            '700': 'hsl(15, 100%, 32%)',
            '800': 'hsl(15, 100%, 24%)',
            '900': 'hsl(15, 100%, 16%)',
            '950': 'hsl(15, 100%, 10%)',
            DEFAULT: '#ff551d'
        },
        secondary: {
            '50': 'hsl(72, 84%, 97%)',
            '100': 'hsl(72, 84%, 94%)',
            '200': 'hsl(72, 84%, 86%)',
            '300': 'hsl(72, 84%, 76%)',
            '400': 'hsl(72, 84%, 64%)',
            '500': 'hsl(72, 84%, 50%)',
            '600': 'hsl(72, 84%, 40%)',
            '700': 'hsl(72, 84%, 32%)',
            '800': 'hsl(72, 84%, 24%)',
            '900': 'hsl(72, 84%, 16%)',
            '950': 'hsl(72, 84%, 10%)',
            DEFAULT: '#dff58b'
        },
        accent: {
            '50': 'hsl(17, 100%, 97%)',
            '100': 'hsl(17, 100%, 94%)',
            '200': 'hsl(17, 100%, 86%)',
            '300': 'hsl(17, 100%, 76%)',
            '400': 'hsl(17, 100%, 64%)',
            '500': 'hsl(17, 100%, 50%)',
            '600': 'hsl(17, 100%, 40%)',
            '700': 'hsl(17, 100%, 32%)',
            '800': 'hsl(17, 100%, 24%)',
            '900': 'hsl(17, 100%, 16%)',
            '950': 'hsl(17, 100%, 10%)',
            DEFAULT: '#ff7a47'
        },
        'neutral-50': '#262626',
        'neutral-100': '#ffffff',
        'neutral-200': '#000000',
        'neutral-300': '#555555',
        'neutral-400': '#f1f1f1',
        'neutral-500': '#101010',
        'neutral-600': '#1b1b1b',
        'neutral-700': '#676767',
        'neutral-800': '#e5e5e5',
        'neutral-900': '#757575',
        background: '#000000',
        foreground: '#ffffff'
    },
    fontFamily: {
        body: [
            '__neueMontreal_8db69f',
            'sans-serif'
        ],
        heading: [
            '__stackSansText_3cee34',
            'sans-serif'
        ],
        font2: [
            '__degularDisplay_1e8a8c',
            'sans-serif'
        ]
    },
    fontSize: {
        '28': [
            '28px',
            {
                lineHeight: '28px',
                letterSpacing: '-0.56px'
            }
        ],
        '30': [
            '30px',
            {
                lineHeight: '30px',
                letterSpacing: '-0.3px'
            }
        ],
        '32': [
            '32px',
            {
                lineHeight: '32px',
                letterSpacing: '0.32px'
            }
        ],
        '34': [
            '34px',
            {
                lineHeight: '34px',
                letterSpacing: '-0.34px'
            }
        ],
        '38': [
            '38px',
            {
                lineHeight: '38px',
                letterSpacing: '-0.38px'
            }
        ],
        '42': [
            '42px',
            {
                lineHeight: '42px',
                letterSpacing: '-0.42px'
            }
        ],
        '44': [
            '44px',
            {
                lineHeight: '44px',
                letterSpacing: '-0.88px'
            }
        ],
        '54': [
            '54px',
            {
                lineHeight: '54px',
                letterSpacing: '-0.54px'
            }
        ],
        '56': [
            '56px',
            {
                lineHeight: '56px'
            }
        ],
        '58': [
            '58px',
            {
                lineHeight: '58px',
                letterSpacing: '-0.58px'
            }
        ],
        '60': [
            '60px',
            {
                lineHeight: '72px',
                letterSpacing: '-0.6px'
            }
        ],
        '62': [
            '62px',
            {
                lineHeight: '62px',
                letterSpacing: '-0.62px'
            }
        ],
        '64': [
            '64px',
            {
                lineHeight: '64px'
            }
        ],
        '68': [
            '68px',
            {
                lineHeight: '61.2px',
                letterSpacing: '-0.68px'
            }
        ],
        '80': [
            '80px',
            {
                lineHeight: '80px',
                letterSpacing: '-2px'
            }
        ]
    },
    spacing: {
        '1': '2px',
        '24': '48px',
        '28': '56px',
        '32': '64px',
        '40': '80px',
        '48': '96px',
        '56': '112px',
        '80': '160px',
        '89': '178px',
        '100': '200px',
        '104': '208px',
        '116': '232px',
        '130': '260px',
        '166': '332px',
        '127px': '127px',
        '173px': '173px',
        '279px': '279px'
    },
    borderRadius: {
        md: '7px',
        lg: '14px',
        xl: '22px',
        full: '9999px'
    },
    boxShadow: {
        sm: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.043) 0px 10px 26px 0px'
    },
    screens: {
        xs: '380px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '1400px': '1400px'
    },
    transitionDuration: {
        '150': '0.15s',
        '200': '0.2s',
        '300': '0.3s',
        '500': '0.5s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0, 0, 0.2, 1)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '1280px'
    }
},
  },
};
