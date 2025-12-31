# Backend Python Rules

**Scope**: `backend/**/*.py`

## Python Version & Environment

- Python 3.12
- Use virtual environment (`.venv312/`)
- All backend code in `backend/` directory

## Code Style

- **Type hints required**: Use type annotations for all functions
- **PEP 8 compliance**: Follow Python style guide
- **No documentation files**: Don't create `.md` files unless user explicitly requests
- Consider using `ruff` or `black` for formatting

## Architecture Patterns

- **No global side effects**: Don't execute code at import time
- **Pure functions preferred**: Small, testable functions with clear inputs/outputs
- **Entry points**: Use `main()` function for script entry points
- **Modular structure**: Keep files focused on single responsibilities

## File Responsibilities (DO NOT MIX)

- `main.py` - FastAPI application and route definitions
- `generateImage.py` - AI image generation logic
- `removeBG.py` - Background removal processing
- `vectorizeImage.py` - Image vectorization logic
- `test.py` - Testing utilities and scripts

## Dependencies

- **Always update** `backend/requirements.txt` when adding new packages
- Pin versions for production stability (e.g., `fastapi==0.109.0`)
- Current dependencies: FastAPI, Uvicorn, Pillow, python-multipart, python-dotenv

## FastAPI Conventions

- Use async/await for async operations
- Proper HTTP status codes (200, 201, 400, 404, 500)
- Request/response models with Pydantic
- Error handling with HTTPException
- File uploads use `UploadFile` type

## Image Processing Guidelines

- Validate file types before processing (JPEG, PNG, WebP)
- Handle large files gracefully (streaming, memory limits)
- Return appropriate error messages for invalid images
- Clean up temporary files after processing

## Testing

- Test API endpoints with actual requests
- Validate image processing outputs
- Test error cases (invalid files, missing params)