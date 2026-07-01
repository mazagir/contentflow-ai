# ContentFlow AI

Generador de contenido de marketing para agencias digitales y freelancers de habla hispana.

## Stack

| Componente | Tecnología |
|---|---|
| Motor de IA | DeepSeek (`deepseek-chat`) |
| Auth y base de datos | Supabase |
| Pagos | Stripe + PayPal |
| Frontend | Next.js 15 + Tailwind |

## Instalación

```bash
npm install
cp .env.example .env
```

Configura todas las variables en `.env` (ver `.env.example`).

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta el SQL de `supabase/schema.sql` en el editor SQL
3. Copia la URL y las keys al `.env`
4. Activa Email/Password en Authentication → Providers

## Stripe

1. Crea productos Starter ($9/mes) y Pro ($29/mes) en Stripe
2. Copia los `price_...` IDs a `STRIPE_PRICE_STARTER` y `STRIPE_PRICE_PRO`
3. Configura el webhook apuntando a `/api/webhooks/stripe` con el evento `checkout.session.completed`

## PayPal

1. Crea una app en [developer.paypal.com](https://developer.paypal.com) (sandbox)
2. Copia Client ID y Secret al `.env`

## Uso

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

1. Regístrate (5 créditos gratis)
2. Completa nicho, tipo de contenido y descripción
3. Genera y copia el resultado
4. Al agotar créditos, aparece el checkout de Stripe o PayPal según tu método registrado

## Planes

| Plan | Créditos | Marca de agua |
|---|---|---|
| Free | 5 | Sí |
| Starter | Ilimitado | No |
| Pro | Ilimitado | No |

## Estructura

```
src/
├── app/api/
│   ├── generate/          # Generación con DeepSeek
│   ├── checkout/stripe/   # Checkout Stripe
│   ├── checkout/paypal/   # Checkout PayPal
│   ├── webhooks/stripe/   # Webhook post-pago
│   └── profile/           # Perfil del usuario
├── components/
│   ├── AppShell.tsx
│   ├── AuthPanel.tsx
│   ├── ContentForm.tsx
│   ├── UpgradeModal.tsx
│   └── UserBar.tsx
└── lib/
    ├── prompt.ts          # System prompt completo
    ├── deepseek.ts        # Cliente DeepSeek
    ├── users.ts           # Lógica de créditos/planes
    └── supabase/          # Clientes Supabase
supabase/
└── schema.sql             # Tablas y RLS
```
