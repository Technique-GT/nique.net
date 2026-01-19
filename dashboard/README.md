# The Campus Chronicle - Student News Platform

![Campus Chronicle Logo](public/logo.png) <!-- Add your newspaper logo path -->

A digital-first student news platform built by students, for students. Featuring award-winning journalism, multimedia storytelling, and real-time campus coverage.

## Technologies Used

- ⚡ **Vite** - Next-gen frontend tooling  
- 🎨 **ShadCN/ui** - Beautifully designed components  
- ✨ **Framer Motion** - Smooth reading experience animations  
- 📱 **React** - Modern frontend framework  
- 🚀 **TypeScript** - Type-safe JavaScript  
- 🛠️ **TanStack Router** - Client-side routing  

## Getting Started

### Prerequisites

- Node.js v18+ (recommended v20)  
- npm v9+ or pnpm v8+  
- Git  

### Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/campus-chronicle/web-app.git
   cd web-app
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```
   or  
   ```bash
   pnpm install
   ```

3. **Configure environment**  
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your CMS and API keys.

### Running the Development Server

```bash
npm run dev
```
or  
```bash
pnpm dev
```

The application will be available at:  
[http://localhost:5173](http://localhost:5173)

## Project Structure

```
campus-chronicle/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utilities and helpers
│   ├── sections/      # News sections (news, sports, etc.)
│   ├── styles/        # Global styles
│   ├── cms/           # Content management integration
│   └── assets/        # Images, icons, etc.
├── .env.example       # Environment variables template
├── vite.config.ts     # Vite configuration
└── tsconfig.json      # TypeScript configuration
```

## Key Features

- **Editorial Workflow System**  
  Custom CMS for student journalists to submit and edit stories  
- **Multimedia Integration**  
  Supports embedded videos, photo galleries, and interactive content  
- **Real-time Updates**  
  Push notifications for breaking campus news  
- **Accessible Reading**  
  Optimized for all devices with dark/light mode  

## Available Scripts

- `dev` - Start development server  
- `build` - Create production build  
- `preview` - Preview production build locally  
- `lint` - Run ESLint  
- `type-check` - Verify TypeScript types  

## Deployment

For production deployment:

```bash
npm run build
```

The build artifacts will be in the `dist/` directory. Deploy to:

- Student organization web hosting  
- University servers  
- Vercel/Netlify for student access  

## Content Management

Integrates with:

- **Sanity.io** for article management  
- **Cloudinary** for media assets  
- **Google Docs** for collaborative editing  

## Contributing

We welcome student contributors!  
1. Attend our onboarding workshop  
2. Claim an issue from our board  
3. Submit PRs for review by editorial staff  

## License

[MIT](LICENSE) © 2024 The Campus Chronicle  

---

**Student Press Freedom**  
This project adheres to the Society of Professional Journalists' Code of Ethics
