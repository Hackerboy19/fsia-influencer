import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig} from 'motion/react';
import App from './App.tsx';
import './index.css';
import {installAdminFetch} from './lib/adminSession';

installAdminFetch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Visitors who ask their OS for reduced motion get fades instead of slides and springs */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
