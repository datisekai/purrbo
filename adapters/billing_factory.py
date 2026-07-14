"""Chọn adapter billing. (RevenueCat cắm vào đây — AD-14.)"""
from __future__ import annotations

from domain.ports import BillingPort


def make_billing() -> BillingPort:
    from adapters.billing_mock import MockBilling
    return MockBilling()
