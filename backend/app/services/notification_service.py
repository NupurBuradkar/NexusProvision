"""
Notification Service for Slack webhooks and enterprise event alerting.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
from app.config import settings

logger = logging.getLogger("seqa.notifications")


class NotificationService:
    def __init__(self):
        # In-memory record of recent notifications (useful for UI feed and testing)
        self.notification_history: List[Dict[str, Any]] = []

    def notify(
        self,
        event_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        severity: str = "info",
    ) -> Dict[str, Any]:
        """
        Dispatches notification to configured channels (Slack, console, internal event history).
        """
        payload = {
            "event_type": event_type,
            "title": title,
            "message": message,
            "severity": severity,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Keep latest 100 in history
        self.notification_history.insert(0, payload)
        if len(self.notification_history) > 100:
            self.notification_history.pop()

        logger.info(f"[{severity.upper()}] {title} - {message}")

        # If Slack Webhook is provided, send asynchronous or synchronous HTTP POST
        if settings.SLACK_WEBHOOK_URL:
            try:
                slack_payload = {
                    "text": f"*{title}*\n{message}",
                    "attachments": [
                        {
                            "color": "#36a64f" if severity == "info" else "#de425b",
                            "fields": [
                                {"title": k, "value": str(v), "short": True}
                                for k, v in (metadata or {}).items()
                            ],
                            "footer": "SEQA Provision Notification",
                            "ts": int(datetime.utcnow().timestamp()),
                        }
                    ],
                }
                httpx.post(settings.SLACK_WEBHOOK_URL, json=slack_payload, timeout=5.0)
            except Exception as e:
                logger.warning(f"Failed to post notification to Slack webhook: {e}")

        return payload


notification_service = NotificationService()
