import { useState } from "react";
import {
  RedoRounded,
  UndoRounded,
} from "@mui/icons-material";
import {
  Box,
  Container,
  CssBaseline,
  IconButton,
  Tab,
  Tabs,
  ThemeProvider,
  Tooltip,
  createTheme,
} from "@mui/material";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { BlockNoteEditor } from "./editors/BlockNoteEditor";
import { TiptapEditor } from "./editors/tiptap";
import "./App.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5b5bd6" },
    background: { default: "#f5f6fa", paper: "#ffffff" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 750, letterSpacing: "-0.04em" },
  },
});

function App() {
  const [activeEditor, setActiveEditor] = useState(0);
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const historyState = useEditorState({
    editor: tiptapEditor,
    selector: ({ editor }) => ({
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

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
              <Box
                className="tabs-history-actions"
                aria-label="История изменений Tiptap"
              >
                <Tooltip title="Отменить">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!historyState?.canUndo}
                      onClick={() => tiptapEditor?.chain().focus().undo().run()}
                      aria-label="Отменить"
                    >
                      <UndoRounded />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Повторить">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!historyState?.canRedo}
                      onClick={() => tiptapEditor?.chain().focus().redo().run()}
                      aria-label="Повторить"
                    >
                      <RedoRounded />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
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
  );
}

export default App;
