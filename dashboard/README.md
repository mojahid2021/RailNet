# RailNet Admin Dashboard

A professional, production-ready admin panel built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern admin interface with sidebar navigation
- Dashboard with key metrics and recent activity
- User management page with data table
- Responsive design
- TypeScript for type safety
- ESLint for code quality
- Turbopack for fast development

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Development:** Turbopack

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables:

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the admin dashboard.

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Dashboard page
│   └── users/          # Users page
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   ├── admin-layout.tsx
│   ├── header.tsx
│   └── sidebar.tsx
└── lib/               # Utility functions
    └── utils.ts
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This app can be deployed to Vercel, Netlify, or any platform supporting Next.js.

For production deployment, make sure to:

1. Set up environment variables
2. Configure your database
3. Set up authentication if needed

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Run `npm run lint` before committing
4. Test your changes thoroughly

## License

MIT
