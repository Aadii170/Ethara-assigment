"""
SQLAlchemy ORM models for the Ethara inventory system.

Four core tables:
  • products     – catalogue of sellable items
  • customers    – buyer directory
  • orders       – header-level order records
  • order_items  – line items tying an order to specific products
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime,
    ForeignKey, CheckConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base


def _utcnow():
    """Timezone-aware UTC timestamp helper."""
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(255), nullable=False)
    sku        = Column(String(100), nullable=False, unique=True, index=True)
    price      = Column(Numeric(10, 2), nullable=False)
    quantity   = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    # guard against negative price or stock at the DB level
    __table_args__ = (
        CheckConstraint("price >= 0",    name="ck_product_price_nonneg"),
        CheckConstraint("quantity >= 0", name="ck_product_qty_nonneg"),
    )

    # relationship used when fetching order items
    order_items = relationship("OrderItem", back_populates="product")

    def __repr__(self):
        return f"<Product {self.sku}: {self.name}>"


class Customer(Base):
    __tablename__ = "customers"

    id         = Column(Integer, primary_key=True, index=True)
    full_name  = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, unique=True, index=True)
    phone      = Column(String(30), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    orders = relationship("Order", back_populates="customer")

    def __repr__(self):
        return f"<Customer {self.email}>"


class Order(Base):
    __tablename__ = "orders"

    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    status       = Column(String(20), nullable=False, default="pending")
    created_at   = Column(DateTime(timezone=True), default=_utcnow)

    customer = relationship("Customer", back_populates="orders")
    items    = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",   # removing an order removes its items
    )

    def __repr__(self):
        return f"<Order #{self.id} — {self.status}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal   = Column(Numeric(10, 2), nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_orderitem_qty_positive"),
    )

    order   = relationship("Order",   back_populates="items")
    product = relationship("Product", back_populates="order_items")

    def __repr__(self):
        return f"<OrderItem order={self.order_id} product={self.product_id} qty={self.quantity}>"
