import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import ThemeToggle from './Components/ThemeToggle';
import AppShell from './Layouts/AppShell';

const pages = import.meta.glob('./pages/**/*.jsx');

createInertiaApp({
  resolve: name => pages[`./pages/${name}.jsx`]().then((module) => module.default),
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <AppShell initialPage={props.initialPage}>
          <App {...props} />
        </AppShell>
        <ThemeToggle />
      </>
    );
  },
});
