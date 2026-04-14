<h1 align="center">
  <br>
  📦 StockHome
  <br>
</h1>

<p align="center">
  <strong>Smart household inventory management — know what you have, where it is, and when it expires.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## ✨ Features

- **🏠 Household & rooms** — Create households, invite members, organise everything into rooms and containers (boxes, shelves, drawers…)
- **📦 Inventory tracking** — Add items with quantity, tags, photos and descriptions; adjust stock with + / − controls inline
- **🔍 QR code scanning** — Every container gets a unique QR code; scan to jump straight to its contents
- **⏰ Expiry tracking** — Set expiry dates on perishable items, get colour-coded alerts (green → orange → red) and a dedicated *Expiring Soon* page
- **🛒 Shopping list** — Consumable items with a minimum-stock rule automatically appear when they run low; restock with a single quantity confirmation
- **📜 Movement history** — Every creation, update, quantity change and deletion is logged; browse with pagination and export to CSV or JSON
- **📧 Email notifications** — Configurable expiry alerts (*N days before*) and a weekly stock summary, delivered by scheduled cron jobs
- **📄 PDF export** — Generate a full household inventory PDF, perfectly formatted with room hierarchy and item lists
- **👥 Multi-household** — Belong to several households at once and switch between them instantly
- **🌐 Bilingual** — Full English / French UI; easy to extend
- **🎨 Light & dark themes** — Respects system preference; overridable per user
- **🔒 Secure by default** — JWT tokens stored in `httpOnly; SameSite=Strict` cookies, no tokens in `localStorage`

---

## 📸 Overview

| Rooms & containers | Item detail | Shopping list |
|---|---|---|
| Hierarchical tree or grid view | Stock controls + expiry badge + stock rule | Auto-populated from minimum-stock rules |

| Expiring soon | Movement history | Account & notifications |
|---|---|---|
| Colour-coded by urgency, filter by window | Full audit log, CSV/JSON export | Expiry alerts + weekly digest settings |

---

## 🏗 Architecture

```
StockHome/
├── apps/
│   ├── api/          # NestJS 10 — REST API, Auth, Scheduler, Email
│   └── web/          # React 18 + Vite — SPA frontend
└── packages/
    └── shared/       # Shared TypeScript types (Item, User, Household…)
```

**API** — NestJS modules: `auth`, `user`, `household`, `room`, `container`, `item`, `movement-log`, `shopping-list`, `export`, `email`, `notification`  
**Database** — SQLite via TypeORM (`synchronize: true` — schema is managed automatically)  
**Auth** — Passport JWT, access token (15 min) + refresh token (7 days), both in `httpOnly` cookies  
**Scheduler** — `@nestjs/schedule` cron jobs for daily expiry alerts (08:00) and weekly digest (09:00)

---

## 🚀 Getting started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- An SMTP server for email notifications (optional — the app works without it)

### Install

```bash
git clone https://github.com/alexartaud-dev/stockhome.git
cd stockhome
npm install
```

### Configure

Copy the example env file and fill in the values:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret used to sign JWTs | `dev_secret` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `dev_refresh_secret` |
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Sender address | `noreply@stockhome.app` |
| `NODE_ENV` | `production` enables secure cookies | `development` |

### Run (development)

```bash
# Start API (http://localhost:3000)
npm run start:dev --workspace=apps/api

# Start frontend (http://localhost:5173)
npm run dev --workspace=apps/web
```

### Build (production)

```bash
npm run build --workspace=packages/shared
npm run build --workspace=apps/api
npm run build --workspace=apps/web
# Then serve apps/api/dist with Node and apps/web/dist with any static host / reverse proxy
```

---

## 🧩 Key concepts

### Household hierarchy

```
Household
└── Room  (e.g. Kitchen, Garage)
    └── Container  (e.g. Top shelf, Box #3)
        └── Item  (name, qty, tags, expiry, stock rule…)
```

Containers can be **nested** (sub-containers) to any depth.

### Stock rules & shopping list

Mark an item as **Consumable**, set a *minimum quantity*, and it will automatically appear in the Shopping list the moment stock drops below that threshold. Hit the check button, enter the quantity you bought, and it disappears.

### QR codes

Every container has a unique QR code. Print a label, stick it on the box, then scan it with the in-app scanner to navigate directly to that container — no typing required.

---

## 🛣 Roadmap

- [ ] **PWA / offline mode** — service worker with background sync so the app works without a connection
- [ ] **Push notifications** — browser push as an alternative to email
- [ ] **Barcode scanning** — look up products by EAN/UPC and auto-fill item details
- [ ] **Recipe integration** — automatically deduct ingredients when you cook

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes
4. Push and open a PR

---

## 📄 License

[MIT](LICENSE) © AlexArtaud-Dev
