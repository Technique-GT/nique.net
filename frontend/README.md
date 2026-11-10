# React + TypeScript + Vite

This project uses Biome for linting and formatting.

Install workspace dependencies from the repository root and start the public site
with the root workspace command:

```bash
npm ci
npm run dev:web
```

The repository root contains the shared npm lockfile and development settings;
this folder contains the frontend application and its app-specific dependencies.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- `npm run lint` - Check code with Biome
- `npm run format` - Format code with Biome
