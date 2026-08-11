import sys
import os
from pathlib import Path

# Add backend directory to sys.path so internal backend imports resolve correctly
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import backend.main as _backend_main
app = _backend_main.app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 56060))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
