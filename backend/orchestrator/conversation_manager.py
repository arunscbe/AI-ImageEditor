from typing import Dict, List, Optional, Any
from datetime import datetime
import json


class ConversationMessage:
    def __init__(
        self,
        role: str,
        content: str,
        timestamp: Optional[datetime] = None,
        images: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.role = role
        self.content = content
        self.timestamp = timestamp or datetime.now()
        self.images = images or []
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "images": self.images,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationMessage':
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            images=data.get("images", []),
            metadata=data.get("metadata", {})
        )


class Conversation:
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.messages: List[ConversationMessage] = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.context: Dict[str, Any] = {}
    
    def add_message(
        self,
        role: str,
        content: str,
        images: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        message = ConversationMessage(
            role=role,
            content=content,
            images=images,
            metadata=metadata
        )
        self.messages.append(message)
        self.updated_at = datetime.now()
        return message
    
    def get_messages_for_llm(self, max_messages: int = 5) -> List[Dict[str, str]]:
        recent_messages = self.messages[-max_messages:]
        return [
            {"role": msg.role, "content": msg.content}
            for msg in recent_messages
        ]
    
    def get_recent_images(self, count: int = 5) -> List[str]:
        all_images = []
        for msg in reversed(self.messages):
            all_images.extend(msg.images)
            if len(all_images) >= count:
                break
        return all_images[:count]
    
    def set_context(self, key: str, value: Any):
        self.context[key] = value
        self.updated_at = datetime.now()
    
    def get_context(self, key: str, default: Any = None) -> Any:
        return self.context.get(key, default)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "conversation_id": self.conversation_id,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "context": self.context
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conversation':
        conv = cls(data["conversation_id"])
        conv.messages = [
            ConversationMessage.from_dict(msg) for msg in data["messages"]
        ]
        conv.created_at = datetime.fromisoformat(data["created_at"])
        conv.updated_at = datetime.fromisoformat(data["updated_at"])
        conv.context = data.get("context", {})
        return conv


class ConversationManager:
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
    
    def get_or_create_conversation(self, conversation_id: str) -> Conversation:
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = Conversation(conversation_id)
        return self.conversations[conversation_id]
    
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        return self.conversations.get(conversation_id)
    
    def delete_conversation(self, conversation_id: str) -> bool:
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            return True
        return False
    
    def list_conversations(self) -> List[str]:
        return list(self.conversations.keys())
    
    def clear_old_conversations(self, max_age_hours: int = 24):
        now = datetime.now()
        to_delete = []
        
        for conv_id, conv in self.conversations.items():
            age_hours = (now - conv.updated_at).total_seconds() / 3600
            if age_hours > max_age_hours:
                to_delete.append(conv_id)
        
        for conv_id in to_delete:
            del self.conversations[conv_id]
        
        return len(to_delete)


conversation_manager = ConversationManager()


