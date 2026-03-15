"""
Kokoro TTS API Server - Fixed Version
Run: python scripts/kokoro-server.py
"""
import os
import io
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from kokoro_onnx import Kokoro
import asyncio

app = FastAPI()

# Paths to local model files
KOKORO_DIR = r"C:\Users\yodat\.openclaw\kokoro"
MODEL_PATH = os.path.join(KOKORO_DIR, "onnx", "model_quantized.onnx")
VOICES_DIR = os.path.join(KOKORO_DIR, "voices")

# Pre-initialized Kokoro instance
kokoro = None

def init_kokoro():
    global kokoro
    print("Initializing Kokoro...")
    # List available voices
    voice_files = [f for f in os.listdir(VOICES_DIR) if f.endswith('.bin')]
    print(f"Found {len(voice_files)} voice files")
    print(f"Sample voices: {voice_files[:5]}")

    # Kokoro can work with just the model - voices are selected by filename
    kokoro = Kokoro(
        model_path=MODEL_PATH,
        voices_path=VOICES_DIR  # Pass directory - it should work
    )
    print("Kokoro initialized!")

# Initialize on startup
init_kokoro()

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0

@app.post("/v1/audio/speech")
async def generate_speech(request: TTSRequest):
    try:
        # Map voice names
        voice_map = {
            "af_heart": "af_heart",
            "af_nova": "af_nova",
            "am_adam": "am_adam",
            "bf_alice": "bf_alice",
        }
        voice_id = voice_map.get(request.voice, request.voice)

        # Ensure we have the .bin extension
        if not voice_id.endswith('.bin'):
            voice_id = voice_id + ".bin"

        voice_path = os.path.join(VOICES_DIR, voice_id)
        if not os.path.exists(voice_path):
            voice_path = os.path.join(VOICES_DIR, "af_heart.bin")  # fallback

        print(f"Using voice: {voice_path}")

        audio = kokoro.generate(
            request.text,
            voice=request.voice,  # Pass the name, Kokoro handles it
            speed=request.speed
        )

        # Save to buffer
        buffer = io.BytesIO()
        audio.export(buffer, format="mp3")
        buffer.seek(0)

        return Response(content=buffer.getvalue(), media_type="audio/mpeg")

    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/voices")
async def list_voices():
    voice_files = [f for f in os.listdir(VOICES_DIR) if f.endswith('.bin')]
    voices = [{"id": f.replace('.bin', ''), "name": f.replace('.bin', '')} for f in voice_files]
    return JSONResponse(content={"voices": voices})

if __name__ == "__main__":
    import uvicorn
    print("Starting Kokoro TTS server on http://localhost:8880")
    uvicorn.run(app, host="0.0.0.0", port=8880)