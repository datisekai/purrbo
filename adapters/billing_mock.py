"""Billing mock — dev. (RevenueCat thật: verify receipt server-side — AD-14.)"""
from __future__ import annotations


class MockBilling:
    async def verify_purchase(self, user_id: str, receipt: str) -> bool:
        return bool(receipt)  # dev: coi như hợp lệ nếu có receipt
