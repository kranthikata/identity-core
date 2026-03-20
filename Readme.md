# 🛡️ Identity-Core

**Identity-Core** is a professional-grade Identity and Access Management (IAM) service built with **Node.js** and **TypeScript**. It is designed to be a decoupled, scalable backend for managing user authentication and authorization.

---

## 🚀 Project Overview

This project serves as a central hub for security logic. Instead of building auth into every application, Identity-Core provides a secure, standalone API to handle:

- **Identity Verification:** Robust user registration and login flows.
- **Data Integrity:** Type-safe database operations with Prisma ORM.
- **Modern Standards:** Native ES Modules (ESM) and TypeScript for type safety.
- **Security First:** Environment-driven configuration and PostgreSQL-backed persistence.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v20+)
- **Language:** TypeScript (Strict Mode)
- **Framework:** Express.js (v5)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Testing:** Vitest
- **Development:** Tsx (TypeScript Execute)

---

## 📂 Project Structure

```text
identity-core/
├── prisma/             # Database schema and migrations
|   ├── schema.prisma   # Single source of truth for models
|   └── migrations/     # Version-controlled SQL history
├── src/
│   └── app.ts          # Server entry point
├── dist/               # Compiled JavaScript (Production-ready)
├── .env.example        # Template for environment variables
├── tsconfig.json       # TypeScript configuration (NodeNext)
├── prisma.config.ts    # Prisma configuration
└── package.json        # Project manifest and scripts
```

---

## ⚙️ Local Setup & Installation

Follow these steps to get your development environment running on your local machine:

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** (v20 or higher)
- **PostgreSQL** (Running instance)
- **npm** (Comes with Node.js)

### 2. Installation

Clone the repository and install the project dependencies:

```bash
npm install
```

### 3. Environment Configuration

Create a local .env file by copying the provided template. Open the file and update the DATABASE_URL with your PostgreSQL username and password:

#### For Mac / Linux / PowerShell:

```bash
cp .env.example .env
```

#### For Windows (Command Prompt):

```bash
copy .env.example .env
```

### 4. Database Initialization

Sync the database schema with your local PostgreSQL instance and generate the Prisma Client:

```bash
npx prisma migrate dev
```

### 5. Start Development Server

Launch the application in development mode with hot-reloading:

```bash
npm run dev
```
