# Delcom Cash Flow (Nuxt 4 + TypeScript)

Studi Kasus 2 - PABWE 2026 P5. Sumber data: https://open-api.delcom.org/docs/1.0/api-cash-flows

## Persiapan
1. Ganti `name` di `package.json` (dan nama folder) menjadi `{ifs24028}-pabwe2026-sk-p5-nuxt`.
2. `bun install`
3. Salin `.env.example` menjadi `.env` bila belum ada (`VITE_DELCOM_BASEURL`, `APP_PORT`).

## Perintah
- `bun run dev` - jalankan aplikasi (http://localhost:3000)
- `bun run build` lalu `bun run start` - build dan preview produksi
- `bun run test:coverage` - unit test Vitest dengan threshold coverage 100%

## Struktur
`src/features/{auth,users,cashflows,common}`, `src/helpers`, `src/hooks`, rute di
`src/routes.ts` yang disuplai ke Nuxt lewat `src/router.options.ts`.
