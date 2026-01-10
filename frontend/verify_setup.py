"""
Frontend Setup Verification Script
Checks if everything is ready to run the frontend
"""

import os
import sys

def check_model_files():
    """Check if model files exist"""
    print("\n📦 Checking Model Files...")
    print("-" * 50)
    
    model_path = os.path.join('..', 'data', 'sentiment_model.pkl')
    vectorizer_path = os.path.join('..', 'data', 'vectorizer.pkl')
    
    model_exists = os.path.exists(model_path)
    vectorizer_exists = os.path.exists(vectorizer_path)
    
    print(f"Model file:     {'✓' if model_exists else '✗'} {model_path}")
    print(f"Vectorizer:     {'✓' if vectorizer_exists else '✗'} {vectorizer_path}")
    
    return model_exists and vectorizer_exists

def check_frontend_files():
    """Check if frontend files exist"""
    print("\n📄 Checking Frontend Files...")
    print("-" * 50)
    
    required_files = [
        'index.html',
        'api.py',
        'requirements.txt',
        'README.md'
    ]
    
    all_exist = True
    for file in required_files:
        exists = os.path.exists(file)
        all_exist = all_exist and exists
        print(f"{file:<20} {'✓' if exists else '✗'}")
    
    return all_exist

def check_dependencies():
    """Check if required Python packages are installed"""
    print("\n🐍 Checking Python Dependencies...")
    print("-" * 50)
    
    required_packages = {
        'flask': 'Flask',
        'flask_cors': 'Flask-CORS',
        'joblib': 'joblib',
        'sklearn': 'scikit-learn',
        'pandas': 'pandas'
    }
    
    all_installed = True
    for import_name, package_name in required_packages.items():
        try:
            __import__(import_name)
            print(f"{package_name:<20} ✓")
        except ImportError:
            print(f"{package_name:<20} ✗ (NOT INSTALLED)")
            all_installed = False
    
    return all_installed

def print_instructions():
    """Print next steps"""
    print("\n" + "="*50)
    print("🚀 NEXT STEPS")
    print("="*50)
    print("\n1. Start the Backend Server:")
    print("   python api.py")
    print("\n2. Open index.html in your browser")
    print("   - Double-click index.html, or")
    print("   - Use: python -m http.server 8000")
    print("   - Then visit: http://localhost:8000/index.html")
    print("\n3. Test with sample feedback")
    print("\n" + "="*50)

def main():
    print("\n" + "="*50)
    print("✅ Frontend Setup Verification")
    print("="*50)
    
    # Check all
    models_ok = check_model_files()
    files_ok = check_frontend_files()
    deps_ok = check_dependencies()
    
    print("\n" + "="*50)
    print("📊 VERIFICATION SUMMARY")
    print("="*50)
    
    if models_ok:
        print("✓ Model files found")
    else:
        print("✗ Model files NOT found - Train model first!")
        print("  Run: python scripts/train_model.py")
    
    if files_ok:
        print("✓ Frontend files complete")
    else:
        print("✗ Some frontend files missing")
    
    if deps_ok:
        print("✓ All dependencies installed")
    else:
        print("✗ Missing dependencies!")
        print("  Run: pip install -r requirements.txt")
    
    if models_ok and files_ok and deps_ok:
        print("\n✅ Everything is ready!")
        print_instructions()
        return 0
    else:
        print("\n❌ Some issues need to be fixed")
        if not deps_ok:
            print("\nFix: pip install -r requirements.txt")
        if not models_ok:
            print("\nFix: python scripts/train_model.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
