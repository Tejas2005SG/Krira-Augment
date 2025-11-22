"""
Debug script to test Krira Labs SDK and identify configuration issues.

Run this script to diagnose why you're getting "The information is not available in the provided context."
"""

import os
import sys
import requests
import json
from typing import Dict, Any, Optional


# Configuration - UPDATE THESE VALUES
API_KEY = "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432"
BOT_ID = "employee3"
PYTHON_BACKEND_URL = "https://rag-python-backend.onrender.com/v1"
NODE_BACKEND_URL = "https://your-node-backend.onrender.com"  # UPDATE THIS!
SERVICE_SECRET = "your-service-secret-here"  # UPDATE THIS!


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_result(success: bool, message: str, data: Optional[Dict] = None):
    """Print a formatted result."""
    status = "[✓]" if success else "[✗]"
    print(f"\n{status} {message}")
    if data:
        print(json.dumps(data, indent=2))


def test_python_backend_health():
    """Test if Python backend is accessible."""
    print_section("TEST 1: Python Backend Health Check")
    
    try:
        url = f"{PYTHON_BACKEND_URL.rstrip('/v1')}/health"
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            print_result(True, "Python backend is accessible", response.json())
            return True
        else:
            print_result(False, f"Python backend returned status {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Failed to connect to Python backend: {e}")
        return False


def test_api_key_verification():
    """Test if API key verification works."""
    print_section("TEST 2: API Key Verification")
    
    try:
        url = f"{NODE_BACKEND_URL.rstrip('/')}/api/keys/verify"
        print(f"Testing: {url}")
        
        headers = {
            "Content-Type": "application/json",
            "x-service-key": SERVICE_SECRET
        }
        
        payload = {
            "apiKey": API_KEY,
            "botId": BOT_ID
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "API key verified successfully")
            
            # Check bot configuration
            bot = data.get("bot", {})
            embedding = bot.get("embedding", {})
            llm = bot.get("llm", {})
            
            print("\nBot Configuration:")
            print(f"  Bot ID: {bot.get('id')}")
            print(f"  Bot Name: {bot.get('name')}")
            print(f"\nEmbedding Configuration:")
            print(f"  Vector Store: {embedding.get('vectorStore')}")
            print(f"  Model: {embedding.get('model')}")
            print(f"  Dimension: {embedding.get('dimension')}")
            print(f"  Dataset IDs: {embedding.get('datasetIds')}")
            
            pinecone_config = embedding.get('pineconeConfig', {})
            print(f"\nPinecone Configuration:")
            print(f"  Index Name: {pinecone_config.get('indexName')}")
            print(f"  Namespace: {pinecone_config.get('namespace')}")
            print(f"  API Key: {'***' + pinecone_config.get('apiKey', '')[-4:] if pinecone_config.get('apiKey') else 'MISSING'}")
            
            print(f"\nLLM Configuration:")
            print(f"  Provider: {llm.get('provider')}")
            print(f"  Model: {llm.get('model')}")
            print(f"  Top K: {llm.get('topK')}")
            
            # Identify issues
            issues = []
            if not embedding.get('datasetIds'):
                issues.append("❌ No dataset IDs configured!")
            if not pinecone_config.get('apiKey'):
                issues.append("❌ Pinecone API key missing!")
            if not pinecone_config.get('indexName'):
                issues.append("❌ Pinecone index name missing!")
            if not llm.get('provider') or not llm.get('model'):
                issues.append("❌ LLM configuration incomplete!")
            
            if issues:
                print("\n⚠️  Configuration Issues Found:")
                for issue in issues:
                    print(f"  {issue}")
            else:
                print("\n✓ Bot configuration looks complete")
            
            return data
        else:
            error_data = {}
            try:
                error_data = response.json()
            except:
                error_data = {"text": response.text}
            
            print_result(False, f"API verification failed with status {response.status_code}", error_data)
            return None
            
    except Exception as e:
        print_result(False, f"Failed to verify API key: {e}")
        return None


def test_pinecone_index(bot_config: Dict[str, Any]):
    """Test if Pinecone index is accessible and has data."""
    print_section("TEST 3: Pinecone Index Check")
    
    try:
        embedding = bot_config.get("bot", {}).get("embedding", {})
        pinecone_config = embedding.get("pineconeConfig", {})
        
        api_key = pinecone_config.get("apiKey")
        index_name = pinecone_config.get("indexName")
        namespace = pinecone_config.get("namespace", "")
        
        if not api_key or not index_name:
            print_result(False, "Missing Pinecone configuration")
            return False
        
        print(f"Pinecone Index: {index_name}")
        print(f"Pinecone Namespace: '{namespace}'")
        
        # Try to import and use Pinecone
        try:
            from pinecone import Pinecone
        except ImportError:
            print_result(False, "Pinecone SDK not installed. Run: pip install pinecone")
            return False
        
        # Initialize Pinecone
        pc = Pinecone(api_key=api_key)
        index = pc.Index(index_name)
        
        # Get index stats
        stats = index.describe_index_stats()
        print_result(True, "Connected to Pinecone index")
        
        print(f"\nIndex Statistics:")
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        
        if hasattr(stats, 'namespaces'):
            namespaces = stats.namespaces or {}
            print(f"  Namespaces: {list(namespaces.keys())}")
            
            if namespace and namespace in namespaces:
                ns_stats = namespaces[namespace]
                print(f"  Vectors in namespace '{namespace}': {ns_stats.get('vector_count', 0)}")
            elif namespace:
                print(f"  ⚠️  Warning: Namespace '{namespace}' not found in index!")
        
        # Try a test query
        dataset_ids = embedding.get("datasetIds", [])
        if dataset_ids:
            print(f"\nTesting query with dataset filter: {dataset_ids}")
            
            # Create a dummy vector for testing
            dimension = embedding.get("dimension", 1536)
            dummy_vector = [0.1] * dimension
            
            query_kwargs = {
                "vector": dummy_vector,
                "top_k": 5,
                "include_metadata": True,
                "filter": {"dataset_id": {"$in": dataset_ids}}
            }
            
            if namespace:
                query_kwargs["namespace"] = namespace
            
            try:
                results = index.query(**query_kwargs)
                matches = results.get("matches", []) if isinstance(results, dict) else getattr(results, "matches", [])
                
                print(f"  Query returned {len(matches)} results")
                
                if matches:
                    print("\n  Sample matches:")
                    for i, match in enumerate(matches[:3], 1):
                        metadata = match.get("metadata", {}) if isinstance(match, dict) else getattr(match, "metadata", {})
                        dataset_id = metadata.get("dataset_id", "unknown")
                        text_preview = metadata.get("chunk_text", "")[:50]
                        print(f"    {i}. Dataset: {dataset_id}, Text: {text_preview}...")
                    
                    print_result(True, "Pinecone has data and is queryable!")
                else:
                    print_result(False, "No vectors found matching the dataset filter!")
                    print("\n  ⚠️  This is why you're getting 'information not available'")
                    print("  Possible causes:")
                    print("    1. Data was never uploaded to Pinecone")
                    print("    2. Data was uploaded to a different namespace")
                    print("    3. Dataset IDs in metadata don't match bot configuration")
                    
            except Exception as e:
                print_result(False, f"Query failed: {e}")
        else:
            print_result(False, "No dataset IDs configured - cannot test query")
        
        return True
        
    except Exception as e:
        print_result(False, f"Pinecone check failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_sdk_chat():
    """Test the actual SDK chat functionality."""
    print_section("TEST 4: SDK Chat Test")
    
    try:
        from kriralabs import Kriralabs
    except ImportError:
        print_result(False, "Kriralabs SDK not installed. Run: pip install /path/to/kriralabs-sdk")
        print("\nAlternatively, test with direct HTTP request:")
        return test_direct_chat()
    
    try:
        # Initialize client
        client = Kriralabs(
            api_key=API_KEY,
            bot_id=BOT_ID,
            base_url=PYTHON_BACKEND_URL
        )
        
        question = "give me employees name who has excellent performance"
        print(f"Asking: {question}")
        
        # Send request
        response = client.ask(question)
        
        print_result(True, "SDK chat request succeeded")
        print(f"\nAnswer: {response.answer}")
        print(f"Bot ID: {response.bot_id}")
        print(f"Conversation ID: {response.conversation_id}")
        
        if "not available in the provided context" in response.answer.lower():
            print("\n⚠️  Warning: Received 'not available' response")
            print("This means the RAG pipeline is working but no relevant chunks were found.")
            print("Check TEST 3 results for Pinecone data issues.")
        
        client.close()
        return True
        
    except Exception as e:
        print_result(False, f"SDK chat failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_direct_chat():
    """Test chat with direct HTTP request."""
    print_section("TEST 4 (Alternative): Direct HTTP Chat Test")
    
    try:
        url = f"{PYTHON_BACKEND_URL}/chat"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "bot_id": BOT_ID,
            "query": "give me employees name who has excellent performance"
        }
        
        print(f"POST {url}")
        print(f"Headers: {headers}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Chat request succeeded", data)
            
            answer = data.get("answer", "")
            if "not available in the provided context" in answer.lower():
                print("\n⚠️  Warning: Received 'not available' response")
                print("This means the RAG pipeline is working but no relevant chunks were found.")
        else:
            error_data = {}
            try:
                error_data = response.json()
            except:
                error_data = {"text": response.text}
            
            print_result(False, f"Chat request failed with status {response.status_code}", error_data)
        
        return response.status_code == 200
        
    except Exception as e:
        print_result(False, f"Direct chat failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all diagnostic tests."""
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║                  KRIRA LABS SDK DIAGNOSTIC TOOL                            ║
╚════════════════════════════════════════════════════════════════════════════╝
    
This script will test your SDK setup and identify configuration issues.
    """)
    
    # Check configuration
    if "UPDATE THIS" in NODE_BACKEND_URL or "your-" in NODE_BACKEND_URL.lower():
        print("⚠️  Please update NODE_BACKEND_URL in this script before running!")
        print(f"   Current value: {NODE_BACKEND_URL}")
        sys.exit(1)
    
    if "your-service-secret" in SERVICE_SECRET.lower():
        print("⚠️  Please update SERVICE_SECRET in this script before running!")
        print(f"   Current value: {SERVICE_SECRET}")
        sys.exit(1)
    
    # Run tests
    results = {
        "python_backend": False,
        "api_verification": None,
        "pinecone": False,
        "sdk_chat": False
    }
    
    # Test 1: Python backend health
    results["python_backend"] = test_python_backend_health()
    
    # Test 2: API key verification
    if results["python_backend"]:
        results["api_verification"] = test_api_key_verification()
    else:
        print("\n⚠️  Skipping API verification test (Python backend not accessible)")
    
    # Test 3: Pinecone index
    if results["api_verification"]:
        results["pinecone"] = test_pinecone_index(results["api_verification"])
    else:
        print("\n⚠️  Skipping Pinecone test (API verification failed)")
    
    # Test 4: SDK chat
    if results["api_verification"]:
        results["sdk_chat"] = test_sdk_chat()
    else:
        print("\n⚠️  Skipping SDK chat test (API verification failed)")
    
    # Summary
    print_section("SUMMARY")
    
    all_passed = (
        results["python_backend"] and
        results["api_verification"] is not None and
        results["pinecone"] and
        results["sdk_chat"]
    )
    
    if all_passed:
        print("\n✓ All tests passed!")
        print("\nIf you're still getting 'not available' responses, the issue is likely:")
        print("  - Your question doesn't match the embedded content")
        print("  - The topK value is too low")
        print("  - The embedding model needs retuning")
    else:
        print("\n✗ Some tests failed. Fix the issues above and try again.")
        print("\nMost common fixes:")
        print("  1. Update API_VERIFICATION_URL in python-backend/.env")
        print("  2. Ensure SERVICE_API_SECRET matches in both backends")
        print("  3. Upload data to Pinecone with correct dataset IDs")
        print("  4. Verify bot configuration in MongoDB")


if __name__ == "__main__":
    main()
