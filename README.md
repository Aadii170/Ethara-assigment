# Ethara — Inventory & Order Management System

A production-ready, containerized full-stack application for managing products, customers, orders, and inventory tracking.

## Tech Stack

| Layer          | Technology                    |
|----------------|-------------------------------|
| **Frontend**   | React 18, React Router, Axios |
| **Backend**    | Python 3.11, FastAPI, SQLAlchemy |
| **Database**   | PostgreSQL 16                 |
| **Containers** | Docker, Docker Compose        |

## Features

### Product Management
- Create, read, update, delete products
- Unique SKU enforcement
- Stock level tracking with low-stock alerts

### Customer Management
- Add and manage customer directory
- Unique email validation
- Search and filter

### Order Management
- Multi-item order creation
- Automatic stock reduction on order placement
- Stock restoration on order cancellation
- Auto-calculated totals
- Insufficient inventory protection

### Dashboard
- Total products, customers, and orders
- Low stock product alerts
- Real-time data from the API

## Quick Start with Docker Compose

### Prerequisites
- Docker & Docker Compose installed

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ethara
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Set environment variables
set DATABASE_URL=postgresql://user:pass@localhost:5432/ethara_db
set CORS_ORIGINS=http://localhost:3000

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Set the API URL
echo REACT_APP_API_URL=http://localhost:8000 > .env

npm start
```

## API Endpoints

### Products
| Method | Endpoint          | Description            |
|--------|-------------------|------------------------|
| POST   | `/products/`      | Create a product       |
| GET    | `/products/`      | List all products      |
| GET    | `/products/{id}`  | Get product by ID      |
| PUT    | `/products/{id}`  | Update product         |
| DELETE | `/products/{id}`  | Delete product         |

### Customers
| Method | Endpoint           | Description            |
|--------|--------------------|------------------------|
| POST   | `/customers/`      | Create a customer      |
| GET    | `/customers/`      | List all customers     |
| GET    | `/customers/{id}`  | Get customer by ID     |
| DELETE | `/customers/{id}`  | Delete customer        |

### Orders
| Method | Endpoint        | Description          |
|--------|-----------------|----------------------|
| POST   | `/orders/`      | Place an order       |
| GET    | `/orders/`      | List all orders      |
| GET    | `/orders/{id}`  | Get order details    |
| DELETE | `/orders/{id}`  | Cancel/delete order  |

### Dashboard
| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | `/dashboard/`  | Summary statistics   |

## Business Rules

1. **Unique SKU** — Each product must have a unique SKU code (409 on conflict)
2. **Unique Email** — Each customer email must be unique (409 on conflict)
3. **Non-negative Stock** — Product quantity cannot be negative
4. **Inventory Check** — Orders are rejected if any product has insufficient stock (400)
5. **Auto Stock Deduction** — Placing an order automatically reduces product quantities
6. **Stock Restoration** — Cancelling an order restores product quantities
7. **Auto Total Calculation** — Order total is computed server-side from unit prices × quantities

## Project Structure

```
ethara/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + lifespan
│   │   ├── config.py        # Environment-based settings
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   └── routers/
│   │       ├── products.py  # Product endpoints
│   │       ├── customers.py # Customer endpoints
│   │       ├── orders.py    # Order endpoints
│   │       └── dashboard.py # Dashboard endpoint
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.js           # Root component + routes
│   │   ├── index.css        # Design system
│   │   ├── api/api.js       # Axios API layer
│   │   ├── components/      # Reusable UI components
│   │   └── pages/           # Page-level components
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Deployment

### Backend → Render
1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (`DATABASE_URL`, `CORS_ORIGINS`)

### Frontend → Vercel
1. Import the project on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Set `REACT_APP_API_URL` to your Render backend URL
4. Deploy

### Database → Render PostgreSQL
1. Create a free PostgreSQL instance on Render
2. Copy the connection string to your backend's `DATABASE_URL`

## License

This project was built as a technical assessment submission.
