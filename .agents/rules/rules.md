---
trigger: always_on
---

# Project Rules

Hard constraints. These override convenience, speed of writing code, or a "simpler" alternative. If a suggestion conflicts with a rule below, the rule wins.

## Database & ORM
1. All database access goes through **Prisma**. No raw SQL, no direct `pg` queries, no `$queryRaw` unless there is genuinely no Prisma equivalent — and even then, flag it before writing it.
2. Every schema change goes through a Prisma migration. Never hand-edit the database out of band.
3. Queries fetch only the fields/relations the endpoint actually needs (`select` / `include` deliberately) — no blanket `findMany()` with everything attached.
4. Watch for N+1 patterns; use Prisma's relation loading (`include`) instead of looping and querying per item.
5. Every write that touches money, stock, or order state that involves more than one table update uses a Prisma transaction (`$transaction`).

## Business Logic Placement
6. **Business logic lives in the backend, full stop.** Pricing, discount/coupon math, stock validation, review eligibility (must have purchased), order status transitions, role checks — all server-side.
7. Frontend code never makes an authorization or business-rule decision on its own. It can hide/disable a button for UX, but the backend must independently enforce the same rule — the UI check is a courtesy, not the source of truth.
8. Input validation happens on the backend for every mutating route, regardless of what the frontend already validated.

## Frontend State
9. Server data (products, orders, cart, categories, reviews, dashboard stats) goes through **React Query**. Never copy server data into Zustand "for convenience" — that creates two sources of truth.
10. Zustand is for client-only state: UI toggles, filter drafts, auth/session shape, checkout step, modal open state.
11. Don't fetch the same data twice through two different mechanisms. If React Query already owns it, read it from there.

## Performance
12. Default to minimizing re-renders: keep state as local as possible, don't lift state up unless it's actually shared, memoize expensive lists/components (`memo`, `useMemo`, `useCallback`) where profiling or obvious cost justifies it — not everywhere reflexively.
13. Paginate or virtualize any list that can grow large (product grids, admin tables, order history). Never fetch an unbounded list.
14. Debounce search/filter inputs before firing a request.
15. No heavy or blocking animations. Keep transitions short (opacity/transform-based), and never animate in a way that delays interactivity or data becoming visible.
16. API responses return only what the view needs — no over-fetching fields, no deeply nested payloads the frontend will just discard.
17. Add database indexes for fields used in filtering/sorting/search (`category`, `price`, `createdAt`, etc.) — don't leave common query paths doing full table scans.

## Code Style & Structure
18. Match the existing project structure (see `instructions.md` section 2/frontend directory layout) — don't introduce a parallel folder convention.
19. Naming: components in PascalCase, hooks prefixed `use`, API service functions named by resource + action (e.g. `getProductById`, `createOrder`).
20. No commented-out code, no leftover `console.log`/`debugger` statements in commits.
21. Every Express route handler has explicit error handling — no unhandled promise rejections, no silent failures. Return consistent error response shapes.
22. Keep components focused — if a component is doing data-fetching, business decisions, and complex rendering all at once, split it.

## Auth & Security
23. JWT auth on every protected route via middleware — never rely on the frontend hiding a route as the actual protection.
24. Admin-only routes (`/api/admin/*`, user list/detail, product/category/coupon mutation) check role server-side in middleware, not just via frontend route guards.
25. Never trust a `productId`/`quantity`/price sent from the client without re-verifying against the database at write time.

## When Unsure
26. If a rule here and a request from the user conflict, point out the conflict rather than silently picking one.
27. If a task requires deviating from Prisma-only access, from the React Query/Zustand split, or from backend-owns-business-logic, that's a flag to raise explicitly, not a quiet exception to make.
