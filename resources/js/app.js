import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/inertia-react';
import { InertiaProgress } from '@inertiajs/progress';
import AiAssistant from './Components/AiAssistant';

createInertiaApp({
  resolve: name => require(`./Pages/${name}`),
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <AiAssistant />
      </>
    );
  },
});

InertiaProgress.init({ color: '#1e62fe' });
