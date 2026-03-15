import edge_tts
import asyncio

async def list_voices():
    voices = await edge_tts.list_voices()
    # Find expressive/neural voices for English
    expressive = [v for v in voices if 'Neural' in v.get('FriendlyName', '') and v['Language'].startswith('en-')]
    print("English Neural Voices:")
    for v in expressive[:20]:
        print(f"  {v['ShortName']}: {v['FriendlyName']}")

asyncio.run(list_voices())