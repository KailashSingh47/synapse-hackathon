# backend/test_upload.py
import requests

url = "http://localhost:8000/api/generate-graph"

# CHANGE THIS to a real PDF file on your computer!
# Put the PDF in your backend folder for easy testing.
file_path = "test_document.pdf" 

try:
    with open(file_path, "rb") as f:
        files = {"file": (file_path, f, "application/pdf")}
        print("Uploading and generating graph... (This might take 10-20 seconds)")
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Here is your Knowledge Graph JSON:")
            import json
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(response.text)
except FileNotFoundError:
    print(f"❌ Could not find {file_path}. Please put a PDF named 'test_document.pdf' in the backend folder.")