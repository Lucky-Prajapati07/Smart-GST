# Smart-GST Vercel Deployment Guide

This repository is a monorepo with:
- Frontend (Next.js): `Smart-GST-Filing-main`
- Backend (NestJS): `backend`

Vercel should host the frontend app. Host backend separately (Render, Railway, Fly.io, or another service), then point frontend to that backend URL.

## 1) Prepare secrets safely

Before deploying, rotate any secrets that were ever committed or shared accidentally:
- Auth0 client secret
- Auth0 secret
- Database URL credentials
- SMTP app password
- API keys

## 2) Deploy backend first

Deploy `backend` to your preferred Node host and note its public base URL, for example:
- `https://smart-gst-backend.onrender.com`

Set backend environment variables on that host:
- `DATABASE_URL`
- `PORT` (host-specific)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `CORS_ORIGINS` (comma-separated), for example:
  - `https://your-frontend-domain.vercel.app`
  - `https://www.your-custom-domain.com`

## 3) Import repo in Vercel

When connecting GitHub repository to Vercel, choose one of the two safe options:

### Option A (recommended)
- Set Root Directory to `Smart-GST-Filing-main`
- Framework preset: Next.js

### Option B (works with this repo)
- Keep Root Directory as repo root
- This repo now includes root `build` scripts that forward to `Smart-GST-Filing-main`

## 4) Set frontend environment variables in Vercel

Set these in Vercel Project Settings -> Environment Variables:

- `AUTH0_SECRET`
- `AUTH0_BASE_URL` = your frontend URL, e.g. `https://your-frontend-domain.vercel.app`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `NEXT_PUBLIC_API_URL` = your deployed backend base URL
- `ADMIN_EMAILS` = comma-separated admin emails
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (if used)
- `GOOGLE_API_KEY` / Gemini vars (if used by your assistant routes)

Do not set localhost URLs in Vercel production env.

## 5) Configure Auth0 application

In Auth0 Application settings:
- Allowed Callback URLs:
  - `https://your-frontend-domain.vercel.app/api/auth/callback`
- Allowed Logout URLs:
  - `https://your-frontend-domain.vercel.app`
- Allowed Web Origins:
  - `https://your-frontend-domain.vercel.app`

If you use a custom domain, add both the Vercel domain and custom domain.

## 6) Trigger deployment

- Push to GitHub branch
- Ensure Vercel build succeeds
- Visit homepage and test:
  - `/`
  - `/login`
  - `/api/auth/login`
  - `/dashboard` after auth

## 7) If you still see NOT_FOUND

Checklist:
- Correct Vercel project and branch selected
- Root Directory points to frontend (or root scripts are used)
- Deployment exists and is not deleted
- Domain is attached to the correct project
- No typo in URL path
- Vercel build logs show Next.js build from frontend app
