"""Middleware to validate and clean text content"""

import re
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import json

class TextValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.emoji_pattern = re.compile(
            r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]'
        )
    
    def clean_text(self, text):
        """Remove emojis and ensure English-only content"""
        if isinstance(text, str):
            return self.emoji_pattern.sub('', text)
        return text
    
    def clean_data(self, data):
        """Recursively clean data structure"""
        if isinstance(data, dict):
            return {key: self.clean_data(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.clean_data(item) for item in data]
        elif isinstance(data, str):
            return self.clean_text(data)
        return data
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Clean response content if JSON
        if response.headers.get("content-type", "").startswith("application/json"):
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            try:
                data = json.loads(body.decode())
                cleaned_data = self.clean_data(data)
                cleaned_body = json.dumps(cleaned_data).encode()
                
                return Response(
                    content=cleaned_body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
            except:
                pass
        
        return response