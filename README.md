# GridGuard — Setup Guide (XAMPP + Node.js)

## What you need
- XAMPP installed with MySQL running (port 3306)
- Node.js installed (https://nodejs.org — download LTS)

---

## Step 1 — Folder structure

Place the files like this:

```
gridguard/
├── frontend/
│   └── index.html
└── backend/
    ├── server.js
    ├── db.js
    ├── .env
    ├── package.json
    └── routes/
        ├── auth.js
        ├── scenarios.js
        └── bill.js
```

---

## Step 2 — Install packages

Open Command Prompt inside the backend folder:

```
cd gridguard/backend
npm install
```

That installs all packages from package.json automatically.

---

## Step 3 — Check .env settings

Open .env — the defaults work for a standard XAMPP install:

```
PORT=3000
JWT_SECRET=gridguard_secret_key_change_this_before_demo
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gridguard
```

If you set a password for MySQL root in XAMPP, add it to DB_PASSWORD.

---

## Step 4 — Start XAMPP MySQL

Open XAMPP Control Panel and click Start next to MySQL.
You do NOT need to create the database manually — the backend creates it automatically.

---

## Step 5 — Start the backend

In Command Prompt inside the backend folder:

```
node server.js
```

You should see:
  MySQL connected. Tables ready.
  GridGuard running at http://localhost:3000

---

## Step 6 — Open the app

Go to http://localhost:3000 in your browser.

---

## Verify the database was created

1. Open XAMPP and click Admin next to MySQL (opens phpMyAdmin)
2. You should see a database called gridguard on the left
3. Inside it: gridguard_users, gridguard_scenarios, gridguard_bills

---

## Demo account

Register any account through the app, or use the demo button which logs in with:
  Email:    demo@gridguard.app
  Password: demo123

Note: the demo account must be registered first through the Sign Up page.

---

## API endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | No |
| POST | /api/auth/login | No |
| GET  | /api/auth/me | Yes |
| POST | /api/scenarios | Yes |
| GET  | /api/scenarios | Yes |
| DELETE | /api/scenarios/:id | Yes |
| POST | /api/bill | Yes |
| GET  | /api/bill | Yes |
| GET  | /api/bill/:month | Yes |
| GET  | /api/health | No |
