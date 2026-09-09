import { useState } from 'react'

import {
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
} from '@mui/material'
import type { Editor } from '@tiptap/core'
import { BlockNoteEditor } from './editors/BlockNoteEditor'
import { TiptapEditor } from './editors/tiptap'
import './App.css'
import { theme } from './app/theme'
import { EditorHistoryActions } from './app/EditorHistoryActions'

function App() {
  const [activeEditor, setActiveEditor] = useState(0)
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="lg"
        component="main"
        className="app-main"
        sx={{ p: { xs: 2, md: 4 } }}
      >
        <Box className="editor-card">
          <Box className="tabs-bar">
            <Tabs
              value={activeEditor}
              onChange={(_, value: number) => setActiveEditor(value)}
              aria-label="Выбор текстового редактора"
            >
              <Tab
                label="BlockNote"
                id="editor-tab-0"
                aria-controls="editor-panel-0"
              />
              <Tab
                label="Tiptap"
                id="editor-tab-1"
                aria-controls="editor-panel-1"
              />
            </Tabs>
            {activeEditor === 1 && (
              <EditorHistoryActions editor={tiptapEditor} />
            )}
          </Box>

          <Box
            role="tabpanel"
            id="editor-panel-0"
            aria-labelledby="editor-tab-0"
            hidden={activeEditor !== 0}
            className="editor-panel"
          >
            <BlockNoteEditor />
          </Box>
          <Box
            role="tabpanel"
            id="editor-panel-1"
            aria-labelledby="editor-tab-1"
            hidden={activeEditor !== 1}
            className="editor-panel"
          >
            <TiptapEditor onEditorReady={setTiptapEditor} />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
