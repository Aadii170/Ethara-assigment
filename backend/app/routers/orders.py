"""
Order management endpoints — the most complex router in the system.

Key business logic:
  1. Validate that every product in the order has enough stock
  2. Atomically reduce stock for each line item
  3. Auto-calculate unit_price, subtotal, and total_amount
  4. Restore stock when an order is cancelled / deleted
"""

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Order, OrderItem, Product, Customer
from ..schemas import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderItemResponse,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


# ── helpers ─────────────────────────────────────────────────────────

def _build_order_response(order: Order) -> OrderResponse:
    """Flatten customer name into the order dict for listing views."""
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else None,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
    )


def _build_detail_response(order: Order) -> OrderDetailResponse:
    """Full order including line-item breakdown."""
    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            product_sku=item.product.sku if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]
    return OrderDetailResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else None,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=items,
    )


# ── endpoints ───────────────────────────────────────────────────────

@router.post("/", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    """
    Place a new order.

    Steps:
      1. Verify customer exists
      2. Load every referenced product and check stock
      3. Build line items, deduct stock, compute total
      4. Persist everything in a single transaction
    """
    # 1 — customer check
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    # 2 — load products, validate stock
    product_map: dict[int, Product] = {}
    stock_errors: list[str] = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} does not exist.",
            )
        if product.quantity < item.quantity:
            stock_errors.append(
                f"'{product.name}' has only {product.quantity} in stock "
                f"(requested {item.quantity})."
            )
        product_map[product.id] = product

    if stock_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient inventory: " + " | ".join(stock_errors),
        )

    # 3 — build order & line items
    order = Order(customer_id=payload.customer_id, total_amount=Decimal("0"))
    total = Decimal("0")

    for item in payload.items:
        product = product_map[item.product_id]
        unit_price = product.price
        subtotal   = unit_price * item.quantity

        order.items.append(
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
        )
        # deduct stock
        product.quantity -= item.quantity
        total += subtotal

    order.total_amount = total

    # 4 — persist
    db.add(order)
    db.commit()
    db.refresh(order)

    return _build_detail_response(order)


@router.get("/", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    """List all orders with customer names, newest first."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Fetch full order details including every line item."""
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return _build_detail_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancel / delete an order.
    Restores stock for each line item before removing the record.
    """
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # restore inventory
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
