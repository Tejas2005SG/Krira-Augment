"""
Test the SDK with local backend
"""
import sys
sys.path.insert(0, r'c:\Users\Tejas\Desktop\kriraai\kriralabs-sdk')

from kriralabs import Kriralabs

# Test with local backend
client = Kriralabs(
    api_key="sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
    bot_id="employee3",
    base_url="http://localhost:8000/v1"  # Python backend running locally
)

print("Sending question to bot...")
try:
    response = client.ask("give me employees name who has excellent performance")

    print("\n=== Response ===")
    print(f"Answer: {response.answer}")
    print(f"Bot ID: {response.bot_id}")
    print(f"Conversation ID: {response.conversation_id}")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

client.close()
