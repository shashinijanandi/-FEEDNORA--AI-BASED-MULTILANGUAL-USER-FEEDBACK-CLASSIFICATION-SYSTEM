"""
Frontend Testing Script
Tests the API endpoints and model predictions
"""

import requests
import json
import sys
from time import sleep

API_URL = "http://localhost:5000"

# Test samples for each sentiment
TEST_SAMPLES = {
    "happiness": [
        "This is amazing! I love it!",
        "Best purchase ever, highly recommend",
        "So happy with this product"
    ],
    "sadness": [
        "I'm very disappointed with this",
        "Not what I expected, sad about it",
        "This made me feel terrible"
    ],
    "anger": [
        "This is absolutely terrible!",
        "I'm furious about this service",
        "Worst experience ever, so angry"
    ],
    "disgust": [
        "This is disgusting and awful",
        "I'm disgusted by the quality",
        "This is repulsive"
    ],
    "fear": [
        "I'm worried about the safety",
        "This makes me anxious and concerned",
        "I'm scared this won't work"
    ],
    "surprise": [
        "Wow, I didn't expect this!",
        "That's surprising and unexpected",
        "I'm shocked by this result!"
    ]
}

def check_server_health():
    """Check if server is running"""
    print("\n🔍 Checking Server Health...")
    print("-" * 50)
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Server status: {data.get('status')}")
            print(f"✓ Model loaded: {data.get('model_loaded')}")
            print(f"✓ Vectorizer loaded: {data.get('vectorizer_loaded')}")
            return True
        else:
            print(f"✗ Server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server")
        print(f"  Make sure API is running: python api.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_prediction(feedback, expected_sentiment=None):
    """Test a single prediction"""
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json={"feedback": feedback},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            sentiment = data.get('sentiment', 'unknown')
            confidence = data.get('confidence', 0) * 100
            
            status = "✓"
            if expected_sentiment and sentiment.lower() != expected_sentiment.lower():
                status = "⚠"
            
            print(f"{status} Sentiment: {sentiment:<12} | Confidence: {confidence:>5.1f}%")
            return data
        else:
            print(f"✗ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def run_tests():
    """Run all tests"""
    print("\n" + "="*50)
    print("🧪 Frontend API Testing")
    print("="*50)
    
    # Check server
    if not check_server_health():
        print("\n❌ Server is not running!")
        print("Start it with: python api.py")
        return False
    
    # Test predictions
    print("\n📝 Testing Predictions by Sentiment...")
    print("-" * 50)
    
    all_passed = True
    for sentiment, samples in TEST_SAMPLES.items():
        print(f"\n{sentiment.upper()}:")
        for sample in samples:
            result = test_prediction(sample, sentiment)
            if not result:
                all_passed = False
    
    # Test edge cases
    print("\n\n🔧 Testing Edge Cases...")
    print("-" * 50)
    
    # Empty feedback
    print("\nEmpty feedback:")
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json={"feedback": ""},
            timeout=10
        )
        if response.status_code != 200:
            print("✓ Correctly rejected empty feedback")
        else:
            print("⚠ Should reject empty feedback")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Very long feedback
    print("\nVery long feedback (1000 chars):")
    long_text = "This product is great! " * 50
    result = test_prediction(long_text)
    
    # Special characters
    print("\nSpecial characters & emojis:")
    result = test_prediction("This is awesome!!! 😊 Really love it @#$%")
    
    print("\n\n" + "="*50)
    if all_passed:
        print("✅ All tests completed!")
    else:
        print("⚠️  Some tests had issues")
    print("="*50)
    
    return True

def interactive_test():
    """Interactive testing mode"""
    print("\n" + "="*50)
    print("💬 Interactive Testing Mode")
    print("="*50)
    print("\nEnter feedback to test (type 'quit' to exit):\n")
    
    while True:
        feedback = input("Enter feedback: ").strip()
        
        if feedback.lower() == 'quit':
            print("\n✓ Testing complete!")
            break
        
        if not feedback:
            print("Please enter some feedback\n")
            continue
        
        print("\nAnalyzing...")
        result = test_prediction(feedback)
        
        if result:
            print(f"Response: {result.get('response')}")
            print()

def main():
    """Main test runner"""
    if not check_server_health():
        print("\n⚠️  Server not running!")
        response = input("\nStart interactive testing anyway? (y/n): ")
        if response.lower() != 'y':
            return 1
    
    # Run automated tests
    run_tests()
    
    # Ask for interactive testing
    print("\n")
    response = input("Run interactive testing? (y/n): ")
    if response.lower() == 'y':
        interactive_test()
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n✓ Testing cancelled")
        sys.exit(0)
