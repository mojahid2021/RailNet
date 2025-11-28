# RailNet Backend

A Fastify server with TypeScript and Prisma for PostgreSQL.

## Setup

1. Install dependencies: `npm install`

2. Set up your PostgreSQL database and update `.env` with the correct DATABASE_URL.

3. Run Prisma migrations: `npm run prisma:migrate`

4. Generate Prisma client: `npm run prisma:generate`

5. Start the server: `npm run dev`

## Scripts

- `npm run build`: Build the project
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run Prisma migrations
- `npm run prisma:studio`: Open Prisma Studio
