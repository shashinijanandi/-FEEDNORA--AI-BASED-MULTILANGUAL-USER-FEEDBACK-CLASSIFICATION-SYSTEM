#!/usr/bin/env python3
"""
copy_models.py - Copy your trained model files into the ai_models/ directory.

Run this ONCE before starting the system:
    python copy_models.py

This script copies your trained model from the original location into
the ai_models/ folder that Docker mounts into the backend container.
"""

import shutil
import os
import sys

# ─── Configure these paths ────────────────────────────────────────────────────
ORIGINAL_MODEL_PATH     = "../data/sentiment_model.pkl"   # path to your trained model
ORIGINAL_VECTORIZER_PATH = "../data/vectorizer.pkl"        # path to your TF-IDF vectorizer

DEST_DIR = "./ai_models"
# ──────────────────────────────────────────────────────────────────────────────


def copy_models():
    os.makedirs(DEST_DIR, exist_ok=True)

    for src, dest_name in [
        (ORIGINAL_MODEL_PATH, "sentiment_model.pkl"),
        (ORIGINAL_VECTORIZER_PATH, "vectorizer.pkl"),
    ]:
        dest = os.path.join(DEST_DIR, dest_name)
        if not os.path.exists(src):
            print(f"⚠️  Source not found: {src}")
            print(f"   Update the path in copy_models.py and re-run.")
            continue
        shutil.copy2(src, dest)
        size_kb = os.path.getsize(dest) / 1024
        print(f"✅ Copied {dest_name} → {dest}  ({size_kb:.1f} KB)")

    print("\nDone! Now run: docker-compose up --build")


if __name__ == "__main__":
    copy_models()
