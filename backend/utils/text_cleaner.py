"""Text cleaning utility to remove emojis and ensure English-only content"""

import re

def remove_emojis(text):
    """Remove all emoji characters from text"""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub('', text)

def clean_api_response(data):
    """Clean API response data of emojis and non-English content"""
    if isinstance(data, dict):
        return {key: clean_api_response(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_api_response(item) for item in data]
    elif isinstance(data, str):
        return remove_emojis(data)
    return data

def validate_english_only(text):
    """Validate text contains only English characters"""
    english_pattern = re.compile(r'^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=\[\]{}|\\:";\'<>?/~`]*$')
    return english_pattern.match(text) is not None