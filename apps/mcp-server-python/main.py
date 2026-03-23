"""Root entry point — delegates to src.main."""

import asyncio
from src.main import main

if __name__ == "__main__":
    asyncio.run(main())
