import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import ThemeToggle from './Components/ThemeToggle';

const pages = import.meta.glob('./pages/**/*.jsx');

createInertiaApp({
  resolve: name => pages[`./pages/${name}.jsx`]().then((module) => module.default),
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <ThemeToggle />
      </>
    );
  },
});
