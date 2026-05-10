#!/usr/bin/env python3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from autoveille import main  # noqa: E402


if __name__ == "__main__":
    legacy_args = []
    if "--force" in sys.argv or "--deploy" in sys.argv or "--deploy-only" in sys.argv:
        if "--deploy-only" in sys.argv:
            legacy_args = ["deploy"]
        else:
            legacy_args = ["veille", "--new"]
            if "--force" in sys.argv:
                legacy_args.append("--force")
            if "--deploy" in sys.argv:
                legacy_args.append("--deploy")

    main(legacy_args or sys.argv[1:])
