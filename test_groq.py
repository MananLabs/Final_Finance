#!/usr/bin/env python3
"""Test Groq API connectivity and response"""

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("Master_AI")
print(f"API Key loaded: {api_key is not None}")
print(f"API Key starts with: {api_key[:10] if api_key else 'None'}...")

if not api_key:
    print("ERROR: Master_AI not configured!")
    exit(1)

try:
    client = Groq(api_key=api_key)
    print("✓ Groq client initialized")
    
    # Simple test
    print("\n📝 Testing simple bot call...")
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": 'Return this JSON: {"test": "success"}'}],
        temperature=0.3,
        max_completion_tokens=100,
        top_p=1,
        stream=False,
    )
    
    response_text = completion.choices[0].message.content
    print(f"✓ Response received: {response_text}")
    
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
    exit(1)

print("\n✓ Groq API is working!")
