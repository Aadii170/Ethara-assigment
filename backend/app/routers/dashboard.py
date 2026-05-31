"""
Dashboard endpoint — returns aggregate stats for the frontend overview.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Product, Customer, Order
from ..schemas import DashboardResponse, LowStockProduct

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 10  # products at or below this count appear in the alert list


@router.get("/", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """
    Single endpoint consumed by the React dashboard.
    Returns totals and a list of products running low on inventory.
    """
    total_products  = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders    = db.query(Order).count()

    low_stock = (
        db.query(Product)
        .filter(Product.quantity <= LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity.asc())
        .all()
    )

    return DashboardResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[
            LowStockProduct(id=p.id, name=p.name, sku=p.sku, quantity=p.quantity)
            for p in low_stock
        ],
    )
