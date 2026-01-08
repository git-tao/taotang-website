"""Supabase client service for database operations."""

from typing import Any, Optional
from supabase import create_client, Client
from functools import lru_cache

from app.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get cached Supabase client using service_role key."""
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


class SupabaseService:
    """Service for Supabase database operations."""

    def __init__(self):
        self.client = get_supabase_client()

    async def create_inquiry(self, inquiry_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new inquiry record.

        Args:
            inquiry_data: Dictionary containing all inquiry fields

        Returns:
            The created inquiry record

        Raises:
            Exception: If database insert fails
        """
        result = (
            self.client.table("inquiries")
            .insert(inquiry_data)
            .execute()
        )

        if not result.data:
            raise Exception("Failed to create inquiry")

        return result.data[0]

    async def get_inquiry(self, inquiry_id: str) -> Optional[dict[str, Any]]:
        """Get an inquiry by ID.

        Args:
            inquiry_id: UUID of the inquiry

        Returns:
            The inquiry record or None if not found
        """
        result = (
            self.client.table("inquiries")
            .select("*")
            .eq("id", inquiry_id)
            .execute()
        )

        return result.data[0] if result.data else None

    async def update_inquiry(
        self, inquiry_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """Update an inquiry record.

        Args:
            inquiry_id: UUID of the inquiry
            updates: Dictionary of fields to update

        Returns:
            The updated inquiry record
        """
        result = (
            self.client.table("inquiries")
            .update(updates)
            .eq("id", inquiry_id)
            .execute()
        )

        if not result.data:
            raise Exception(f"Failed to update inquiry {inquiry_id}")

        return result.data[0]

    async def create_inquiry_event(
        self,
        inquiry_id: str,
        event_type: str,
        actor_type: str = "system",
        actor_id: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create an inquiry event for audit trail.

        Args:
            inquiry_id: UUID of the inquiry
            event_type: Type of event (e.g., "created", "status_change")
            actor_type: Who triggered the event (system/founder/webhook)
            actor_id: ID of the actor if applicable
            old_value: Previous value if a change
            new_value: New value if a change
            reason: Reason for the change

        Returns:
            The created event record
        """
        event_data = {
            "inquiry_id": inquiry_id,
            "event_type": event_type,
            "actor_type": actor_type,
            "actor_id": actor_id,
            "old_value": old_value,
            "new_value": new_value,
            "reason": reason,
        }

        result = (
            self.client.table("inquiry_events")
            .insert(event_data)
            .execute()
        )

        if not result.data:
            raise Exception("Failed to create inquiry event")

        return result.data[0]

    async def check_rate_limit(
        self, email: str, ip_address: Optional[str] = None
    ) -> tuple[bool, str]:
        """Check if submission is within rate limits.

        Args:
            email: Email address to check
            ip_address: IP address to check

        Returns:
            Tuple of (is_allowed, reason_if_blocked)
        """
        from datetime import datetime, timedelta

        # Check email rate limit: 3 per day
        one_day_ago = (datetime.utcnow() - timedelta(days=1)).isoformat()
        email_result = (
            self.client.table("inquiries")
            .select("id", count="exact")
            .eq("email", email)
            .gte("created_at", one_day_ago)
            .execute()
        )

        if email_result.count and email_result.count >= 3:
            return False, "Maximum submissions per email reached for today"

        # Check IP rate limit: 10 per hour (if IP provided)
        if ip_address:
            one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
            ip_result = (
                self.client.table("inquiries")
                .select("id", count="exact")
                .eq("ip_address", ip_address)
                .gte("created_at", one_hour_ago)
                .execute()
            )

            if ip_result.count and ip_result.count >= 10:
                return False, "Too many submissions from this location"

        return True, ""

    # Webhook event methods
    async def create_webhook_event(
        self,
        event_id: str,
        event_type: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """Create a webhook event record for idempotency tracking.

        Args:
            event_id: Stripe event ID
            event_type: Type of webhook event
            payload: Full event payload

        Returns:
            The created webhook event record
        """
        import json

        event_data = {
            "stripe_event_id": event_id,
            "event_type": event_type,
            "payload": json.dumps(payload) if isinstance(payload, dict) else payload,
            "status": "pending",
        }

        result = (
            self.client.table("webhook_events")
            .insert(event_data)
            .execute()
        )

        if not result.data:
            raise Exception("Failed to create webhook event")

        return result.data[0]

    async def update_webhook_event(
        self,
        event_id: str,
        status: str,
        error: Optional[str] = None,
    ) -> dict[str, Any]:
        """Update a webhook event status.

        Args:
            event_id: Stripe event ID
            status: New status (pending, processed, failed)
            error: Error message if failed

        Returns:
            The updated webhook event record
        """
        updates = {"status": status}
        if error:
            updates["error"] = error
        if status == "processed":
            from datetime import datetime
            updates["processed_at"] = datetime.utcnow().isoformat()

        result = (
            self.client.table("webhook_events")
            .update(updates)
            .eq("stripe_event_id", event_id)
            .execute()
        )

        return result.data[0] if result.data else {}

    # Payment methods
    async def create_payment(self, payment_data: dict[str, Any]) -> dict[str, Any]:
        """Create a payment record.

        Args:
            payment_data: Dictionary containing payment fields

        Returns:
            The created payment record
        """
        import json

        # Convert metadata dict to JSON string if needed
        if "metadata" in payment_data and isinstance(payment_data["metadata"], dict):
            payment_data["metadata"] = json.dumps(payment_data["metadata"])

        result = (
            self.client.table("payments")
            .insert(payment_data)
            .execute()
        )

        if not result.data:
            raise Exception("Failed to create payment")

        return result.data[0]

    async def get_payment_by_stripe_id(
        self, stripe_payment_id: str
    ) -> Optional[dict[str, Any]]:
        """Get a payment by Stripe payment ID.

        Args:
            stripe_payment_id: Stripe payment intent or session ID

        Returns:
            The payment record or None if not found
        """
        result = (
            self.client.table("payments")
            .select("*")
            .eq("stripe_payment_id", stripe_payment_id)
            .execute()
        )

        return result.data[0] if result.data else None

    async def update_payment(
        self, payment_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """Update a payment record.

        Args:
            payment_id: UUID of the payment
            updates: Dictionary of fields to update

        Returns:
            The updated payment record
        """
        result = (
            self.client.table("payments")
            .update(updates)
            .eq("id", payment_id)
            .execute()
        )

        if not result.data:
            raise Exception(f"Failed to update payment {payment_id}")

        return result.data[0]


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get the Supabase service singleton."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
