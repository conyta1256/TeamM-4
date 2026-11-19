This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Almacenamiento del log en Neon

La aplicación acumula los eventos en `localStorage` y envía un lote al servidor cada 20 acciones. Los lotes incompletos se envían al salir de la página o al volver a abrirla. Si Neon no confirma el guardado, la cola permanece en el navegador para reintentarla; cada lote tiene un ID único para que esos reintentos no dupliquen datos.

Se puede Configurar en `DATABASE_URL` en `.env.local` con la cadena de conexión de Neon. La variable solo se usa en la API del servidor.

Crea la tabla que usa la API en Neon:

```sql
CREATE TABLE public.log_batches (
  session_id text NOT NULL,
  batch_id uuid PRIMARY KEY,
  events jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

La ruta `app/api/log/route.js` acepta hasta 20 eventos por lote. Su endpoint `GET /api/log` devuelve los eventos almacenados en formato individual.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
