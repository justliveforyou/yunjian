import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { NoteWindowPage } from '@/pages/NoteWindowPage';
import { CreateNotePage } from '@/pages/CreateNotePage';
import { initDatabase } from '@/services/database';

// 初始化数据库后再渲染应用
initDatabase()
  .then(() => {
    console.log('Database initialized');
    renderApp();
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    // 即使数据库初始化失败也渲染应用
    renderApp();
  });

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/note/:noteId" element={<NoteWindowPage />} />
          <Route path="/create" element={<CreateNotePage />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
