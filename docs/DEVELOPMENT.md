# ComplyOS Development

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use fictional seed data only for development. Never commit `.env.local`, service-role keys, OAuth secrets, AI keys, or production data.

## Delivery order

Foundation -> organization/RBAC -> documents -> compliance -> tasks/notifications -> risks -> vendors -> AI -> reports -> integrations -> SaaS/admin -> hardening.
