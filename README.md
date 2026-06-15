---
title: DesignFlow
emoji: 🚀
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
app_port: 5000
fullWidth: true
---

# DesignFlow - منصة قوالب التصميم

Full-stack template marketplace platform (RTL/Arabic).

## Environment Variables

Set these in your Space secrets (Settings → Repository secrets):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `REDIS_URL` | Redis URL (optional) |

## Docker

This Space uses a Docker container running Express.js + React.
