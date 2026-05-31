"""
Pydantic schemas for request validation and JSON serialisation.

Naming convention:
  • *Create   – inbound payload for creating a resource
  • *Update   – inbound payload for editing a resource (all fields optional)
  • *Response – outbound shape returned to the client
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ── Products ────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name:     str            = Field(..., min_length=1, max_length=255, examples=["Wireless Keyboard"])
    sku:      str            = Field(..., min_length=1, max_length=100, examples=["KB-WL-001"])
    price:    Decimal        = Field(..., ge=0, examples=[49.99])
    quantity: int            = Field(0, ge=0, examples=[120])


class ProductUpdate(BaseModel):
    name:     Optional[str]     = Field(None, min_length=1, max_length=255)
    sku:      Optional[str]     = Field(None, min_length=1, max_length=100)
    price:    Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int]     = Field(None, ge=0)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    name:       str
    sku:        str
    price:      Decimal
    quantity:   int
    created_at: datetime
    updated_at: datetime


# ── Customers ───────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str      = Field(..., min_length=1, max_length=255, examples=["Arjun Mehta"])
    email:     EmailStr = Field(..., examples=["arjun@example.com"])
    phone:     str      = Field(..., min_length=5, max_length=30, examples=["+91-9876543210"])


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    full_name:  str
    email:      str
    phone:      str
    created_at: datetime


# ── Orders ──────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    """A single line inside a new order."""
    product_id: int = Field(..., gt=0)
    quantity:   int = Field(..., gt=0)


class OrderCreate(BaseModel):
    """Payload to place a new order."""
    customer_id: int                 = Field(..., gt=0)
    items:       List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           int
    product_id:   int
    product_name: Optional[str] = None
    product_sku:  Optional[str] = None
    quantity:     int
    unit_price:   Decimal
    subtotal:     Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    customer_id:   int
    customer_name: Optional[str] = None
    total_amount:  Decimal
    status:        str
    created_at:    datetime


class OrderDetailResponse(OrderResponse):
    """Extended order view that includes the full line-item breakdown."""
    items: List[OrderItemResponse] = []


# ── Dashboard ───────────────────────────────────────────────────────

class LowStockProduct(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:       int
    name:     str
    sku:      str
    quantity: int


class DashboardResponse(BaseModel):
    total_products:    int
    total_customers:   int
    total_orders:      int
    low_stock_products: List[LowStockProduct]
