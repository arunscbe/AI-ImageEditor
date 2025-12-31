# Global Project Rules

## Architecture Boundaries

- **Strict separation**: Do NOT move code between `backend/` and `frontend/` unless explicitly requested
- Frontend communicates with backend via API endpoints only
- No shared code between frontend and backend

## Security

- **Never commit secrets**: No API keys, tokens, or credentials in code or `.env` files
- Use placeholders like `YOUR_API_KEY_HERE` or `****` in examples
- Document required environment variables in README files

## Code Changes Philosophy

- **Minimal changes first**: Prefer targeted edits over full rewrites
- Preserve existing patterns and conventions unless refactoring is explicitly requested
- When in doubt, ask for clarification rather than making assumptions
- **NEVER create documentation files** (`.md`) unless explicitly requested by user

## Communication

- If information is missing, either:
  1. Ask for the specific missing detail, OR
  2. Make the safest assumption and clearly label it as an assumption

## Project Context

This is an **AI Image Editor** with:
- React + Vite + Tailwind CSS frontend (3D Plus branding)
- Python FastAPI backend for image processing
- Features: AI generation, background removal, vectorization, canvas editing
- Routing system for multi-project management
- Feature flag system for gradual rollouts