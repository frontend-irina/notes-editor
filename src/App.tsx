import { Container, CssBaseline, ThemeProvider } from '@mui/material'
import { TiptapEditor } from './editors/tiptap'
import type { Block } from './editors/tiptap'
import './App.css'
import { theme } from './app/theme'

const initialBlocks: Block[] = [{
  id: 'welcome',
  type: 'paragraph',
  props: {
    backgroundColor: 'default',
    textColor: 'default',
    textAlignment: 'left',
  },
  content: [],
  children: [],
}]

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="lg"
        component="main"
        className="app-main"
        sx={{ p: { xs: 2, md: 4 } }}
      >
        <TiptapEditor initialBlocks={initialBlocks} />
      </Container>
    </ThemeProvider>
  )
}

export default App
