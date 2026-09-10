import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5b5bd6' },
    background: { default: '#f5f6fa', paper: '#ffffff' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 750, letterSpacing: '-0.04em' },
  },
})
