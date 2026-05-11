import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import ThemeToggle from './Components/ThemeToggle';
import AppShell from './Layouts/AppShell';

const pages = import.meta.glob('./pages/**/*.jsx');

createInertiaApp({
  resolve: name => pages[`./pages/${name}.jsx`]().then((module) => {
    const Page = module.default;

    if (!name.startsWith('Users/')) {
      Page.layout = Page.layout || ((page) => <AppShell>{page}</AppShell>);
    }

    return Page;
  }),
  setup({ el, App, props }) {
    createRoot(el).render(
      <>
        <App {...props} />
        <ThemeToggle />
      </>
    );
  },
});
