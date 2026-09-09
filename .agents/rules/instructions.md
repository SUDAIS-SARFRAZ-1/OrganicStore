---
trigger: always_on
---

# Project Instructions

## 1. What This Project Is
A full-stack e-commerce platform. Customer-facing storefront (browsing, cart, checkout, orders, reviews) plus an admin dashboard (product/order/customer/coupon management). Full spec lives in `PRD.md` — read that first for feature scope, routes, data model, and API contracts.

## 2. Tech Stack (fixed — do not substitute)
| Layer | Choice |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma — **all** DB access goes through Prisma. No raw SQL / direct queries unless a specific query is impossible in Prisma, and even then it needs explicit sign-off first. |
| Frontend state (client/UI state) | Zustand |
| Server state (data fetching/caching) | React Query |
| Auth | JWT, role-based (customer / admin) |

## 3. Architecture Rule: Where Logic Lives
**All business logic lives in the backend.** This is non-negotiable for this project.

- The frontend's job: render UI, collect input, call the API, display what the API returns.
- The backend's job: validate, authorize, compute, decide.
- Never trust data or decisions computed on the client — stock checks, pricing, discount math, review eligibility, order status transitions all happen server-side, every time, even if the frontend already "knows" the answer.
- If you find yourself writing an `if` statement in a React component that decides whether an action is *allowed* (not just whether to *show* something), that logic almost certainly belongs in the backend instead.

## 4. State Management Split
- **Zustand** → local/UI state and client-only concerns: cart drawer open/closed, selected filters before they're applied, auth token/session shape, wishlist toggle state, form step in checkout.
- **React Query** → anything that comes from the server: products, cart contents (if persisted), orders, categories, reviews, admin dashboard stats. Use it for caching, refetching, loading/error states — don't duplicate server data into Zustand.
- Don't let the two overlap: if data has a database row behind it, it's React Query's job, not Zustand's.

## 5. Performance Requirements
- **Fast data loading is a hard requirement** — customers should not feel delay when browsing, filtering, or checking out. Paginate, debounce search input, prefetch where React Query supports it, and keep API payloads lean (don't return more fields than the view needs).
- **Avoid unnecessary re-renders** — memoize where it actually matters (expensive lists, product grids), keep component state as local as possible, don't lift state higher than it needs to be.
- **No heavy animations.** Simple, fast transitions only (opacity/transform, short duration). Nothing that blocks interaction or adds visible jank — this is a store, not a portfolio animation showcase.
- Optimize both ends: don't treat this as a frontend-only performance concern. Slow queries, missing indexes, and N+1 Prisma calls are just as much a violation of this requirement as a laggy UI.

## 6. Code Quality Bar
- Clean, maintainable, readable code over clever code.
- Consistent naming and file structure (see `rules.md` for the specifics).
- Every mutating backend route validates its input before touching the database.
- No dead code, no commented-out blocks left in, no console.log left in committed code.

## 7. Reference Order
When implementing a feature, check things in this order:
1. `PRD.md` — does this feature exist, and what's the exact scope/route?
2. `rules.md` — is there a hard rule about how to write this?
3. Existing code in the repo — match established patterns before inventing new ones.
4. Ask, rather than guessing, if the above three don't resolve it.
