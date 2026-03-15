import edge_tts
import asyncio
import sys

async def main():
    try:
        voices = await edge_tts.list_voices()
        en_voices = [v for v in voices if v['Language'].startswith('en-US')]
        print('en-US voices (first 20):')
        for v in en_voices[:20]:
            print(f"  {v['ShortName']}: {v.get('Gender', 'N/A')}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

asyncio.run(main())