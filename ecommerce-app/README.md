# E-Commerce App (Node.js + Express + MySQL)

This project implements a full-featured e-commerce backend based on a two-phase approach:

- Phase 1: Pseudo-code design (completed in conversation)
- Phase 2: Implementation based on pseudo-code

## Tech Stack

- Node.js, Express.js
- MySQL (mysql2/promise)
- JWT for authentication
- bcrypt for password hashing
- express-validator for input validation
- Multer for file uploads
- Nodemailer for emails
- PDFKit for invoice generation

## Getting Started

1. Copy `.env.example` to `.env` and set your values.
2. Create MySQL database and run SQL in `database/schema.sql`.
3. Install dependencies:
   - npm install
4. Run in development:
   - npm run dev

## API Overview

- Auth routes under `/api/auth`
- Product routes under `/api/products`
- Cart routes under `/api/cart`
- Checkout & Orders under `/api/checkout` and `/api/orders`
- Admin routes under `/api/admin`

## Pseudo-code ↔ Code Mapping

Each service/controller function contains comments referencing its corresponding pseudo-code section. Search for `// PSEUDO:` comments in the codebase.
