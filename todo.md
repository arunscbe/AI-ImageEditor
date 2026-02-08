# Logo Editor / Design Customizer – Production Implementation Plan
**Delivery Target:** March 31, 2026  
**Status:** Production Blueprint with Tiered Hardening

---

## 🎯 Plan Structure

This is a **production blueprint**, not just a feature list. It balances feature development with production safeguards.

### Two Parallel Tracks

1. **Feature Development Track** - Build user-facing features (Weeks 1-8)
2. **Production Hardening Track** - Build reliability and safety (Parallel, Tier 1 = must have, Tier 2 = add if needed)

### Tier Philosophy

**Tier 1 (Must Have Before Launch):**
- Protects against known production failure modes
- Table stakes for SaaS reliability
- Non-negotiable items (backup, security, concurrency)
- **Realistic scope** - Can be completed by March 31 if auth/org/workers exist

**Tier 2 (Add After Launch If Needed):**
- Advanced features that may not be needed initially
- Add only if metrics/data show actual need
- Prevents over-engineering before measuring

### Critical Non-Negotiables

- ✅ **Backup & Recovery** - Cannot skip (business-ending if data lost)
- ✅ **Deployment Strategy** - API versioning, migration plan (prevents downtime)
- ✅ **Multi-Tenancy** - Organization isolation (must decide early)
- ✅ **Authentication & Session Security** - One bug = cross-org data leakage
- ✅ **Security** - SVG sanitization (XSS prevention)
- ✅ **Concurrency Control** - Optimistic locking (prevents data loss)
- ✅ **RBAC Enforcement** - Every endpoint must enforce permissions
- ✅ **Audit Logging** - Must answer "who changed what"
- ✅ **Release Gate** - Definition of done prevents shipping broken systems

---

## 📋 Database Design Overview

### Required Tables
- **users** - User accounts and preferences
- **organizations** - Multi-tenant organizations
- **sessions** - User sessions/tokens
- **projects** - User projects with canvas data (JSONB), thumbnails, settings, **revision_id** (optimistic locking), **organization_id**
- **project_versions** - Version history for undo/redo (canvas snapshots)
- **images** - All images (original and processed) with metadata, processing chain, **organization_id**
- **image_layers** - Vector layers extracted from SVG (color, visibility, order)
- **color_palettes** - Brand color palettes per user, **organization_id**
- **conversations** - AI chat conversations linked to projects, **organization_id**
- **conversation_messages** - Chat message history
- **processing_jobs** - Async job queue with **idempotency_key** for safe retries, **organization_id**
- **decoration_workflows** - Workflow templates (embroidery→vector, screen_print→raster), **organization_id** (or global)
- **feature_flags** - Feature toggle configuration
- **audit_logs** - Audit trail for compliance and debugging

### Key Features
- UUID primary keys
- **Multi-tenancy** (organization_id on all tenant-scoped tables)
- **Revision tracking** (revision_id/revision_number for optimistic locking)
- **Idempotency keys** (prevent duplicate processing)
- **Audit logging** (who, what, when, org, resource_id)
- JSONB for flexible metadata (canvas_data, settings, processing_params)
- Soft deletes for projects
- Foreign key relationships with CASCADE
- Indexes on frequently queried columns (organization_id, created_at, etc.)

---

## 🔧 Backend Tasks

### Phase 1: Database Setup (Week 1-2)

- [x] **1.1** Install database dependencies (SQLAlchemy, Alembic, PostgreSQL driver)
- [x] **1.2** Create database configuration module
- [~] **1.3** Create SQLAlchemy models for all tables (partial: core models implemented — `Organization`, `User`, `Project`, `Image`, `ProcessingJob`)
- [x] **1.4** Set up Alembic migrations
- [x] **1.5** Create database service layer with CRUD operations
- [x] **1.6** Create project management API endpoints:
  - `POST /projects` - Create project
  - `GET /projects` - List projects (pagination, filtering)
  - `GET /projects/{id}` - Get project
  - `PUT /projects/{id}` - Update project
  - `DELETE /projects/{id}` - Soft delete
  - `POST /projects/{id}/duplicate` - Duplicate project (not implemented)
- [ ] **1.7** Implement auto-save (save canvas every 30 seconds, on changes)
- [ ] **1.8** Create project versioning endpoints:
  - `GET /projects/{id}/versions` - List versions
  - `GET /projects/{id}/versions/{version}` - Get version
  - `POST /projects/{id}/restore/{version}` - Restore version
  - `POST /projects/{id}/versions` - Create snapshot
- [x] **1.9** Enhanced image upload endpoint with metadata storage
- [ ] **1.10** Image processing tracking (parent_image_id chain)

### Phase 2: Vectorization & Editing (Week 3-4)

- [ ] **2.1** SVG path analysis endpoint (`GET /api/images/{id}/nodes`) - Extract nodes/points
- [ ] **2.2** Vector validation endpoint (`POST /api/images/{id}/validate`)
- [ ] **2.3** Enhanced layer extraction - Parse SVG, group by color, preserve order
- [ ] **2.4** Layer visibility API:
  - `PUT /api/images/{id}/layers/{layer_id}/visibility`
  - `PUT /api/images/{id}/layers/reorder`
  - `GET /api/images/{id}/layers/preview`
- [ ] **2.5** Layer grouping support (detect/preserve groups in SVG)
- [ ] **2.6** Smart color reduction algorithm (preserve layer mapping, weight brand colors)
- [ ] **2.7** Manual color selection API:
  - `GET /api/images/{id}/colors` - List all colors
  - `POST /api/images/{id}/reduce-colors/manual` - Reduce keeping selected colors
- [ ] **2.8** Brand color weighting (load user palette, prefer brand colors)
- [ ] **2.9** Prevent auto-merge of same-color layers (preserve layer boundaries)
- [ ] **2.10** Layer naming and metadata storage

### Phase 3: Raster Support (Week 5)

- [ ] **3.1** Raster recolor endpoint (`POST /api/images/{id}/recolor`) - No vectorization
- [ ] **3.2** Decoration type detection (`POST /api/images/{id}/detect-workflow`) - AI analysis
- [ ] **3.3** Workflow routing logic (embroidery/leather/deboss→vector, screen_print/sublimation→raster)

### Phase 4: Background Removal (Week 6)

- [ ] **4.1** Enhanced background removal for complex logos (separate background vs letter black)
- [ ] **4.2** Background removal preview (`POST /api/images/{id}/remove-bg/preview`)
- [ ] **4.3** Background removal confirmation (`POST /api/images/{id}/remove-bg/confirm`)
- [ ] **4.4** Revert functionality (`POST /api/images/{id}/revert`) - Restore original
- [ ] **4.5** Upload-time background removal prompt (modify `/api/ingest/upload`)

### Phase 5: AI Assist (Week 7)

- [ ] **5.1** AI layer separation (`POST /api/images/{id}/ai-separate-layers`) - Use Gemini
- [ ] **5.2** AI color reduction recommendations (`POST /api/images/{id}/ai-recommend-colors`)
- [ ] **5.3** Decoration type detection API (`POST /api/images/{id}/detect-decoration-type`)

### Phase 6: UX Improvements (Week 8)

- [ ] **6.1** Rename "Vectorize" to "Clean & Convert" (all labels, docs, tooltips)
- [ ] **6.2** Add vectorization help text and tooltips
- [ ] **6.3** Ensure original files always retained (is_original flag, never overwrite)
- [ ] **6.4** Original file access endpoints (`GET /api/images/{id}/original`, `/history`)

---

## 🎨 Frontend Tasks

### Phase 1: Database Integration (Week 1-2)

- [ ] **F1.1** Connect ProjectsPage to backend API (`GET /api/projects`)
- [ ] **F1.2** Project creation flow (`POST /api/projects`)
- [ ] **F1.3** Project loading (`GET /api/projects/{id}`, restore canvas with `loadFromJSON()`)
- [ ] **F1.4** Auto-save implementation (debounce 30s, show "Saving..." indicator)
- [ ] **F1.5** Project metadata editing (name, description)
- [ ] **F1.6** History panel component (`HistoryPanel.jsx`)
- [ ] **F1.7** Version restore functionality
- [ ] **F1.8** Manual snapshot creation

### Phase 2: Vectorization & Editing UI (Week 3-4)

- [ ] **F2.1** Wireframe view toggle (show nodes/points overlay)
- [ ] **F2.2** Node interaction (select, highlight, show properties)
- [ ] **F2.3** Enhanced layers panel (color swatches, grouped indicators, names)
- [ ] **F2.4** Layer visibility toggles (eye icon, lock icon)
- [ ] **F2.5** Layer reordering (drag-and-drop)
- [ ] **F2.6** Color reduction dialog (`ColorReductionDialog.jsx`)
- [ ] **F2.7** Manual color selection UI (color picker, select 3-4 colors)
- [ ] **F2.8** Brand color weighting UI (palette selector, toggle)
- [ ] **F2.9** Layer naming (inline editing)
- [ ] **F2.10** Layer grouping UI (group indicators, create/break groups)

### Phase 3: Raster Support UI (Week 5)

- [ ] **F3.1** Raster recolor tool (color mapping interface, preview)
- [ ] **F3.2** Workflow selection UI (decoration type selector, recommendations)

### Phase 4: Background Removal UI (Week 6)

- [ ] **F4.1** Background removal preview (side-by-side comparison)
- [ ] **F4.2** Upload-time BG removal prompt (dialog with preview option)
- [ ] **F4.3** Revert functionality UI (revert button, options)

### Phase 5: AI Assist UI (Week 7)

- [ ] **F5.1** AI layer separation button (processing indicator, display results)
- [ ] **F5.2** Color reduction recommendations panel (multiple options with previews)
- [ ] **F5.3** Workflow suggestion banner (decoration type detection result)

### Phase 6: UX Improvements (Week 8)

- [ ] **F6.1** Update "Vectorize" labels to "Clean & Convert"
- [ ] **F6.2** Add help modals and tooltips
- [ ] **F6.3** Show original file indicator (badge, "View Original" button)

---

## 📝 Feature Requirements Checklist

### Vectorization & Editing
- [ ] Node/Wireframe view (show points/nodes for vector validation)
- [ ] Layer visibility (show color layers + grouped items)
- [ ] Improved color reduction (12 → 4 colors without wrong layer mapping)
- [ ] Manual color selection (pick which 3-4 colors to keep)
- [ ] Brand palette weighting (prefer approved brand colors)

### Color & Layer Control
- [ ] Prevent auto-merge of same-color layers (keep separate)
- [ ] Revert deleted colors/paths (if BG removal removes wrong areas)
- [ ] Upload-time BG removal prompt (ask user on upload)

### Raster Support
- [ ] Raster recolor (no vectorization for screen print/sublimation)
- [ ] Decision flow by decoration type:
  - [ ] Embroidery/leather/deboss → vector workflow
  - [ ] Screen print/sublimation → raster recolor workflow

### Background Removal
- [ ] Improve for complex logos (separate background black vs letter black)

### UX / Simplicity
- [ ] Rename "Vectorize" to "Clean & Convert"
- [ ] Add tooltip/help text (explain what changes after vectorization)
- [ ] Keep original uploaded file always retained

### AI Assist
- [ ] Separate background vs letter colors into different layers
- [ ] Recommend best color reduction outcomes
- [ ] Auto-suggest best workflow by decoration type (vector vs raster)

---

## 🗓️ Timeline

### Feature Development Track
- **Week 1-2**: Database setup, models, project management API
- **Week 3-4**: Vectorization & editing features
- **Week 5**: Raster support
- **Week 6**: Background removal improvements
- **Week 7**: AI assist features
- **Week 8**: UX improvements, testing, polish

### Production Hardening Track - Tier 1 (Parallel, Must Complete)
- **Week 1-2**: Concurrency control, idempotency, security basics, deployment basics, **backup setup**, authentication & session security
- **Week 3-4**: Multi-tenancy schema, RBAC enforcement, audit logging, file storage basics, observability minimal, validation
- **Week 5-6**: Data retention, upload safety, worker governance, testing core, migration compatibility, feature flags
- **Week 7-8**: Frontend offline/retry UX, release gate checklist, SLO targets, determinism, final hardening validation

### Production Hardening Track - Tier 2 (Post-Launch)
- Add only if metrics/data show need
- Prioritize based on actual pain points

**Total: 8 weeks (2 months)**  
**Delivery: March 31, 2026** ✅

**Note**: Production hardening tasks run in parallel with feature development, not sequentially.

---

## 🛡️ Production Hardening (Parallel Track - Weeks 1-8)

**Tier 1: Must Have Before Launch**  
**Tier 2: Add After Launch If Needed**

---

### 1. Concurrency Control (Tier 1)

- [ ] **P1.1** Add revision_id/revision_number to projects table (optimistic locking)
- [ ] **P1.2** Implement revision token in API (`If-Match` header or `revision_id` param)
- [ ] **P1.3** Conflict detection middleware (return 409 Conflict if revision mismatch)
- [ ] **P1.4** Simple conflict resolution: Return 409, force user refresh (no merge for v1)
- [ ] **P1.5** Multi-tab editing detection (polling for revision changes - simple approach)
- [ ] **P1.6** Frontend conflict resolution UI (show "Another tab modified this project" warning)
- [ ] **P1.7** Auto-refresh on revision change (poll every 5s when tab active)
- [ ] **P1.8** **[Tier 2]** Advanced merge strategy (if user testing shows need)

### 2. Idempotency & Retry Safety (Tier 1)

- [ ] **P2.1** Add idempotency_key to processing_jobs table
- [ ] **P2.2** Generate idempotency keys for all processing operations
- [ ] **P2.3** Deduplication logic (check idempotency_key before processing)
- [ ] **P2.4** Safe retry mechanism (exponential backoff, max retries = 3)
- [ ] **P2.5** Job timeout strategy (define per-job-type timeouts)
- [ ] **P2.6** Simple dead-letter handling (mark failed after max retries, log for manual review)
- [ ] **P2.7** Transaction rollback on partial failures (atomic operations)
- [ ] **P2.8** Prevent duplicate child images (check parent+params before creating)
- [ ] **P2.9** **[Tier 2]** Sophisticated dead-letter queue with retry scheduling

### 3. File Storage Strategy (Tier 1)

- [ ] **P3.1** Define storage backend (S3, GCS, or local with migration path)
- [ ] **P3.2** Signed URL generation for private images (expiring URLs, 1 hour default)
- [ ] **P3.3** Access control policy (user can only access own images, org-level isolation)
- [ ] **P3.4** Basic storage cost modeling (estimate usage, set budget alert)
- [ ] **P3.5** Temp file cleanup (delete after 24 hours)
- [ ] **P3.6** **[Tier 2]** CDN strategy (add if serving public assets at scale)
- [ ] **P3.7** **[Tier 2]** Storage lifecycle automation (archive old processed images)
- [ ] **P3.8** **[Tier 2]** Version snapshot cleanup automation (keep last N, archive rest)

### 4. Observability - Minimal Viable (Tier 1)

- [ ] **P4.1** Structured logging (JSON logs with correlation_id per request)
- [ ] **P4.2** Log context: user_id, organization_id (no PII), processing_job_id, error stack traces
- [ ] **P4.3** Central log scrubber:
  - Redact emails, tokens, auth headers from logs
  - Never log API keys, passwords, or secrets
  - Don't store raw request bodies in logs
- [ ] **P4.4** Metrics collection:
  - API latency (p50, p95)
  - Job success/failure rate per job type
  - Queue depth
  - Processing duration by job type
- [ ] **P4.5** Error tracking (Sentry or equivalent, frontend + backend)
- [ ] **P4.6** Health check endpoints (`/health`, `/ready`, `/metrics`)
- [ ] **P4.7** Minimal alerts:
  - Failure rate > 5% over 10 mins
  - Queue depth > N for 10 mins
  - API p95 > target for 10 mins
- [ ] **P4.8** **[Tier 2]** Distributed tracing (add if debugging becomes painful)
- [ ] **P4.9** **[Tier 2]** Full SLO automation and dashboards

### 5. Validation & Limits (Tier 1)

- [ ] **P5.1** Define system limits:
  - Max file size: 20MB (configurable)
  - Max SVG node count: 10,000 nodes
  - Max color count pre-reduction: 50 colors
  - Max canvas objects: 500 objects
  - Max project size: 5MB JSON
- [ ] **P5.2** Input validation middleware (reject oversized files)
- [ ] **P5.3** Timeout thresholds:
  - Color reduction: 30s
  - Vectorization: 60s
  - Background removal: 45s
  - AI layer separation: 90s
- [ ] **P5.4** Handle oversized SVG (embedded raster textures) - reject or warn
- [ ] **P5.5** Frontend validation (prevent upload of oversized files)
- [ ] **P5.6** Graceful degradation (show error, don't crash)
- [ ] **P5.7** CPU/Memory boundaries: Cap concurrent processing jobs per worker (prevent one heavy job from stalling node)

### 6. Security (Tier 1)

- [ ] **P6.1** SVG sanitization layer:
  - Strip `<script>` tags
  - Remove `on*` event handlers
  - Remove external `href` references (or whitelist)
  - Remove `data:` URLs (or validate)
  - Remove `<foreignObject>` (XSS vector)
- [ ] **P6.2** Input validation (reject non-SVG files claiming to be SVG)
- [ ] **P6.3** Content Security Policy headers
- [ ] **P6.4** Rate limiting per user/IP (prevent abuse)
- [ ] **P6.5** File type validation (MIME type + magic bytes)
- [ ] **P6.6** Sanitize canvas_data JSON (prevent injection)

### 7. Determinism Strategy (Tier 1)

- [ ] **P7.1** Deterministic color reduction algorithm (same input → same output)
- [ ] **P7.2** Seed-based randomization (if needed, use deterministic seed)
- [ ] **P7.3** Cache AI suggestions (same image + params → same suggestion)
- [ ] **P7.4** Document non-deterministic operations (AI layer separation)
- [ ] **P7.5** Version algorithm outputs (track algorithm version in metadata)

### 8. Testing Strategy (Tier 1)

- [ ] **P8.1** Unit tests for color reduction logic (test edge cases)
- [ ] **P8.2** Snapshot tests for SVG output (prevent regressions)
- [ ] **P8.3** Integration tests for processing chain (upload → process → save)
- [ ] **P8.4** Concurrency tests (multiple tabs editing same project)
- [ ] **P8.5** Security tests (malformed SVG, XSS attempts)
- [ ] **P8.6** **[Tier 2]** Visual regression tests (compare output images)
- [ ] **P8.7** **[Tier 2]** Load tests for auto-save (concurrent saves)
- [ ] **P8.8** **[Tier 2]** Failure injection tests (simulate partial failures)

### 9. Migration & Backward Compatibility (Tier 1)

- [ ] **P9.1** JSONB schema versioning (add `schema_version` to canvas_data)
- [ ] **P9.2** Migration scripts for old canvas_data formats
- [ ] **P9.3** Backward compatibility layer (support old formats)
- [ ] **P9.4** Version detection (detect old format, auto-migrate on load)
- [ ] **P9.5** Editor state corruption recovery (safe load fallback to last valid version)
- [ ] **P9.6** Project versions storage bounds:
  - Max versions per project: 200 snapshots (configurable)
  - Snapshot cadence rules (every N seconds OR on manual checkpoint)
  - Auto-cleanup oldest versions when limit exceeded
- [ ] **P9.7** **[Tier 2]** Batch migration strategy for old projects

### 10. Cost Modeling & Rate Limiting (Tier 1)

- [ ] **P10.1** Per-operation cost estimate (track for budgeting)
- [ ] **P10.2** Rate limiting per user/IP (basic caps)
- [ ] **P10.3** Per-endpoint limits for expensive operations (vectorize/remove_bg/AI)
- [ ] **P10.4** Abuse protection (detect suspicious patterns)
- [ ] **P10.5** Quota exhaustion handling (graceful error, upgrade prompt)
- [ ] **P10.6** **[Tier 2]** Daily quotas (100/day AI, 500/day processing - add after observing usage)
- [ ] **P10.7** **[Tier 2]** Cost monitoring dashboard (track spend per user/operation)
- [ ] **P10.8** **[Tier 2]** Throttle mechanism (slow down when quota low)

### 11. Rollback Strategy & Feature Flags (Tier 1)

- [ ] **P11.1** Feature flag system (database table or config service)

---

## 🧹 Repo housekeeping (2026-02-09)

Small, actionable repo tasks related to the recent database reorganization and migration work.

- [x] **RH1** Move DB code and Alembic into `backend/database/` and add compatibility wrappers (completed)
- [x] **RH2** Remove legacy `backend/alembic/` copy and top-level `backend/projects.py` and `backend/images.py` (completed)
- [ ] **RH3** Commit the reorganization + migration files to git (recommended commit message below)
- [ ] **RH4** Add a lightweight seed script `backend/scripts/seed_db.py` to create an admin user and sample project
- [ ] **RH5** Add CI step to run `alembic upgrade head` during deploy and before tests
- [ ] **RH6** Add basic integration tests for `/projects` and `/images` (pytest + httpx)

Recommended git commands (run from repo root):

```bash
git add backend/database backend/api scripts/run_migrations.sh docker/pgadmin docker-compose.yml
git rm -r backend/alembic backend/alembic.ini backend/projects.py backend/images.py || true
git commit -m "chore(db): move DB code to backend/database, add alembic, remove legacy copies"
```

If you'd like, I can create the seed script and basic tests next — tell me which to prioritize.
- [ ] **P11.2** Feature flags for:
  - AI layer separation (enable/disable)
  - AI color recommendations
  - New color reduction algorithm
  - Background removal improvements
- [ ] **P11.3** Kill switch (disable feature instantly)
- [ ] **P11.4** **[Tier 2]** Gradual rollout (percentage-based enablement)
- [ ] **P11.5** **[Tier 2]** A/B testing framework (if needed)

### 12. Performance Targets (SLOs) (Tier 1)

- [ ] **P12.1** Define SLO targets:
  - Color reduction: < 800ms for 1k nodes (p95)
  - Background removal: < 2s (p95)
  - Vectorization: < 3s (p95)
  - Autosave write: < 200ms (p95)
  - Project load: < 500ms (p95)
- [ ] **P12.2** SLO dashboards/logs (define targets + monitor in dashboards)
- [ ] **P12.3** **[Tier 2]** Alert on SLO violation (add once baselines known)
- [ ] **P12.4** **[Tier 2]** Performance regression detection automation
- [ ] **P12.5** **[Tier 2]** Optimization tasks (if SLOs not met)

### 13. Deployment Strategy (Tier 1 - CRITICAL)

- [ ] **P13.1** API versioning from day 1 (`/api/v1/...` namespace)
- [ ] **P13.2** Version bump rules (breaking changes → v2)
- [ ] **P13.3** Deprecation policy (even if informal)
- [ ] **P13.4** Migration deployment plan:
  - Apply migrations separately from app rollout
  - Ensure app can run with old+new schema for one release
- [ ] **P13.5** Worker rollout independence (background workers deployable separately from web)
- [ ] **P13.6** Environments: dev, staging, prod (with separate databases)
- [ ] **P13.7** Secrets management:
  - Environment variable management / secret store (Vault, cloud secret manager, or env vars)
  - Key rotation procedure (at least documented)
  - Never log tokens/keys (enforced via log scrubber)
- [ ] **P13.8** **[Tier 2]** Blue/green or rolling deploy strategy

### 14. Backup & Disaster Recovery (Tier 1 - NON-NEGOTIABLE)

- [ ] **P14.1** Database backup strategy:
  - Managed Postgres with automated backups + point-in-time recovery, OR
  - Nightly pg_dump + store off-box (S3/GCS) + retention 7-30 days
- [ ] **P14.2** Define RPO (Recovery Point Objective): 24 hours max
- [ ] **P14.3** Define RTO (Recovery Time Objective): < 4 hours
- [ ] **P14.4** Verify restore once (single restore test - critical validation)
- [ ] **P14.5** Storage backup policy (S3/GCS versioning or replication)
- [ ] **P14.6** Document recovery procedure

### 15. Multi-Tenancy & RBAC (Tier 1)

- [ ] **P15.1** Add organization_id to schema:
  - projects, images, palettes, workflows, conversations, processing_jobs
- [ ] **P15.2** Unique constraints: (organization_id, project_id) for access checks
- [ ] **P15.3** Indexing: (organization_id, created_at) for listings
- [ ] **P15.4** Row-level isolation (all queries filter by organization_id)
- [ ] **P15.5** Define RBAC roles: owner/admin/editor/viewer (coarse level)
- [ ] **P15.6** Access control middleware (verify user belongs to organization)
- [ ] **P15.7** RBAC matrix per endpoint (document who can do what)
- [ ] **P15.8** UI gating (hide buttons based on role) + server-side enforcement (real gate on every endpoint)
- [ ] **P15.9** Cross-org access tests (verify isolation)

### 16. Authentication & Session Security (Tier 1 - CRITICAL)

- [ ] **P16.1** Password hashing (argon2 or bcrypt, cost factor 12+)
- [ ] **P16.2** Password rotation policy (if applicable)
- [ ] **P16.3** Refresh token strategy (rotation + reuse detection if using JWT)
- [ ] **P16.4** CSRF protection (CSRF tokens if using cookies)
- [ ] **P16.5** Secure cookie settings (HttpOnly, Secure, SameSite=Strict)
- [ ] **P16.6** API auth middleware design:
  - Extract user_id + organization_id from token/session
  - Enforce org membership before any data access
  - Log auth failures
- [ ] **P16.7** Session expiration and cleanup (inactive sessions)
- [ ] **P16.8** Email/password account recovery:
  - If client-facing: "forgot password" flow with secure reset tokens
  - If internal-only: Explicitly document "no self-serve recovery at v1, admin provisioning only"

### 17. Audit Logging (Tier 1)

- [ ] **P17.1** Create audit_logs table:
  - Fields: user_id, organization_id, action, resource_type, resource_id, timestamp, ip_address, before_hash, after_hash (not full payloads)
- [ ] **P17.2** Audit events:
  - Project create/update/delete/restore
  - Image processing actions (vectorize, remove_bg, etc.)
  - Role changes (RBAC updates)
  - Organization changes
- [ ] **P17.3** Audit log middleware (auto-log critical actions)
- [ ] **P17.4** Audit log query endpoint (`GET /api/audit-logs` - org-scoped)
- [ ] **P17.5** IP address retention policy (decide if acceptable, how long to retain)
- [ ] **P17.6** PII/data classification: Explicitly mark what's PII vs non-PII in audit logs

### 18. Data Retention & Legal Basics (Tier 1)

- [ ] **P18.1** Delete account/org flow (or disable + data export)
- [ ] **P18.2** Basic data export (export project as JSON only)
- [ ] **P18.3** Purge policy definition:
  - Soft delete retention: 30 days (configurable)
  - Hard delete after retention period (manual or automated)
- [ ] **P18.4** User data export endpoint (`GET /api/users/{id}/export` - project JSON)
- [ ] **P18.5** Account deletion endpoint (`DELETE /api/users/{id}` - soft delete, then purge)
- [ ] **P18.6** **[Tier 2]** Export images as ZIP (defer to post-launch)
- [ ] **P18.7** **[Tier 2]** Full GDPR compliance (if needed, don't claim unless doing it)

### 19. Upload Pipeline Safety (Tier 1)

- [ ] **P19.1** SVG sanitization (already in P6.1, ensure comprehensive)
- [ ] **P19.2** Virus/malware scanning for uploads (if accepting arbitrary files)
  - OR: Strict SVG validation only (if SVG-only workflow)
- [ ] **P19.3** Image decompression bomb protection:
  - Validate image dimensions before full decode
  - Set PIL/ImageMagick limits
  - Reject if dimensions exceed safe threshold
- [ ] **P19.4** File type validation (MIME + magic bytes - already in P6.5, ensure enforced)
- [ ] **P19.5** SVG output hardening (safe serving):
  - Serve SVG with correct Content-Type headers
  - Avoid inline execution contexts
  - Consider rendering to PNG for preview instead of injecting raw SVG into DOM

### 20. Worker Resource Governance (Tier 1)

- [ ] **P20.1** Per-org concurrency caps (one org can't starve others)
  - Max concurrent jobs per organization: 5 (configurable)
- [ ] **P20.2** Worker resource limits (CPU/Memory per job)
- [ ] **P20.3** Throttle heavy jobs (if org exceeds cap, queue with delay)
- [ ] **P20.4** **[Tier 2]** Queue prioritization rules (FIFO + per-org caps first; prioritization adds complexity)

### 21. Frontend Offline/Retry UX (Tier 1)

- [ ] **F21.1** Autosave retry state ("Saving failed, retrying...")
- [ ] **F21.2** Exponential backoff for failed saves
- [ ] **F21.3** User action to retry failed save (manual retry button)
- [ ] **F21.4** Local cache of last N edits in browser storage (IndexedDB or localStorage)
- [ ] **F21.5** Restore from cache on page reload if last save failed
- [ ] **F21.6** Network status detection (show offline indicator)
- [ ] **F21.7** **[Tier 2]** Queue edits when offline, sync when online (offline queue is mini-product)

### 22. Release Gate / Definition of Done (Tier 1)

- [ ] **P22.1** Release checklist:
  - [ ] Restore test completed (backup verification)
  - [ ] 409 conflict behavior tested end-to-end
  - [ ] Cross-org access tests pass (no data leakage)
  - [ ] SVG sanitization tests pass (XSS prevention)
  - [ ] Max limits enforced (file size, nodes) tested
  - [ ] Job retry & partial failure tested
  - [ ] Auth middleware tested (org isolation)
  - [ ] RBAC enforcement tested (all endpoints)
  - [ ] Audit logging verified (critical actions logged)
  - [ ] Offline/retry UX tested (network failure scenarios)
  - [ ] Secrets not logged (log scrubber verified)
  - [ ] Version storage bounds enforced (max versions per project)
- [ ] **P22.2** Pre-deployment smoke tests (automated or manual checklist)
- [ ] **P22.3** Rollback procedure documented

---

## 📊 Priority

### Tier 1: Must Have Before Launch

**Features:**
- Database setup and models (with organization_id)
- Project management API
- Auto-save
- Enhanced layer extraction
- Color reduction improvements
- Raster recolor workflow

**Production Hardening:**
- Concurrency control (P1.1-P1.7) - Optimistic locking, conflict detection
- Idempotency (P2.1-P2.8) - Safe retries, deduplication
- Security (P6.1-P6.6) - SVG sanitization, rate limiting
- Validation & limits (P5.1-P5.7) - File sizes, timeouts, CPU boundaries
- Observability minimal (P4.1-P4.6) - Structured logging, basic metrics, error tracking
- Testing core (P8.1-P8.5) - Unit, integration, concurrency, security tests
- Deployment (P13.1-P13.6) - API versioning, migration plan, environments
- **Backup & Recovery (P14.1-P14.6)** - NON-NEGOTIABLE
- Multi-tenancy (P15.1-P15.9) - Organization isolation, RBAC matrix, enforcement
- Authentication & Security (P16.1-P16.7) - Password hashing, tokens, CSRF, secure cookies
- Audit Logging (P17.1-P17.4) - Who did what when
- Data Retention (P18.1-P18.5) - Delete flows, export, purge policy
- Upload Safety (P19.1-P19.4) - Sanitization, decompression bomb protection
- Worker Governance (P20.1-P20.4) - Per-org caps, queue prioritization
- Frontend Offline/Retry (F21.1-F21.7) - Retry states, local cache
- Release Gate (P22.1-P22.3) - Definition of done, go/no-go checklist
- Determinism (P7.1-P7.5) - Reproducible operations
- Migration compatibility (P9.1-P9.5) - Schema versioning, backward compat
- Feature flags (P11.1-P11.3) - Kill switches
- SLO targets (P12.1-P12.2) - Define and monitor

### Tier 2: Add After Launch If Needed

**Features:**
- Advanced merge strategies
- A/B testing framework
- Advanced rollout percentages

**Production Hardening:**
- Advanced dead-letter queue (P2.9)
- CDN strategy (P3.6)
- Storage lifecycle automation (P3.7-P3.8)
- Distributed tracing (P4.7)
- Full SLO automation (P4.8)
- Visual regression tests (P8.6)
- Load tests (P8.7-P8.8)
- Cost monitoring dashboard (P10.5-P10.6)
- Gradual rollout (P11.4)
- A/B testing (P11.5)
- Performance regression automation (P12.3-P12.4)
- Blue/green deployment (P13.7)

### Medium Priority (Feature Track)
- Project versioning
- Layer visibility API
- Background removal improvements
- Manual color selection
- Brand color weighting
- Node/wireframe view
- AI assist features
- Workflow auto-suggestion
- Layer grouping

### Low Priority
- Terminology updates
- Help text
- Advanced node editing

---

## 🎯 Confidence Classification

### High Confidence (≈90%)
- Database schema and models (with multi-tenancy)
- API endpoint structure (versioned from day 1)
- Feature requirements
- Frontend component breakdown
- **Production hardening Tier 1 items** (proven patterns)
- **Backup strategy** (table stakes, non-negotiable)

### Medium Confidence (Needs Validation)
- Processing time estimates (depends on image complexity)
- Storage cost projections (needs real usage data)
- AI operation costs (varies by provider pricing)
- SLO targets (need baseline measurements)
- Rate limits (prevent abuse without blocking legitimate users)

### Low Confidence (Requires Research/Testing)
- Optimal conflict resolution strategy (start simple, iterate)
- Best storage lifecycle rules (depends on usage patterns)
- Performance optimization targets (baseline first, then optimize)
- Tier 2 items (add only if needed)

### Risk Areas
1. **Concurrency conflicts** - Start with simple 409 refresh, iterate if needed
2. **Storage costs** - Monitor and adjust lifecycle rules
3. **AI costs** - Track and set alerts
4. **SVG complexity** - Edge cases may require additional handling
5. **Performance** - Real-world load may differ from estimates
6. **Multi-tenancy** - Ensure all queries properly filter by organization_id
7. **Auth bugs** - One auth bug = cross-org data leakage (critical)
8. **RBAC gaps** - One forgotten endpoint = security breach
9. **Offline data loss** - Network failure mid-edit = user frustration

### Restraint Principle
**Do not build Tier 2 items until Tier 1 is complete and metrics show need.**

### Critical Trust & Survivability Items
These are small but disproportionately important:
- **Authentication & Session Security** - One bug = cross-org data leakage
- **Secrets Management** - Prevent "oops we leaked prod keys in logs"
- **Audit Logging** - "Who changed my design?" - must answer
- **RBAC Surface Coverage** - Every endpoint must enforce permissions
- **Frontend Offline/Retry** - Prevents catastrophic data loss (local cache, not full offline sync)
- **Version Storage Bounds** - Prevent DB explosion from unlimited snapshots
- **SVG Output Hardening** - Safe rendering prevents whole class of issues
- **Release Gate** - Prevents shipping broken systems

### Realistic Scope Check
**March 31 is achievable if:**
- Auth + org + RBAC already exist in some form, AND
- Worker queue + processing already exist, AND
- You're mostly integrating + hardening

**If not, narrow Tier 1 further** (demote more items to Tier 2)

---

**Last Updated:** February 4, 2026
