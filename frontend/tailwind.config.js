/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1F23',
        graphite: '#5B6470',
        quiet: '#8A929C',
        line: '#E3E6EA',
        paper: '#F4F5F7',
        panel: '#FFFFFF',
        stage: '#D5D8DC',
        mat: { DEFAULT: '#1F6B52', strong: '#17533F', soft: '#E3F0EB' },
        signal: { DEFAULT: '#9A5B0B', soft: '#FBF0DD' },
        fault: { DEFAULT: '#B3261E', soft: '#FBE9E7' },
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Noto Sans SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      fontSize: {
        '13': ['13px', '20px'],
      },
    },
  },
  plugins: [],
}
