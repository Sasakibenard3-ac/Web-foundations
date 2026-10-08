# TicketHub Ticketing System Design

## 1. Requirements

TicketHub is a website that sells tickets for concerts and other events. The system must support normal daily traffic as well as very large spikes when popular concerts go on sale.

### Functional Requirements

The system must allow users to:

1. Register and log in.
2. Browse upcoming concerts and events.
3. Search and filter events.
4. View event information such as venue, date, time and ticket prices.
5. View the seating plan for an event.
6. See which seats are available, held or sold.
7. Select and temporarily hold one or more seats.
8. Release seats when a hold expires.
9. Pay for held tickets.
10. Receive an order confirmation after successful payment.
11. View their purchased tickets.
12. Prevent two customers from purchasing the same seat.
13. Allow administrators to create and manage events and seating plans.
14. Record orders and payments for auditing.

### Non-Functional Requirements

#### Speed

* Normal page requests should usually respond within 1–2 seconds.
* Seat availability should update quickly so customers do not see outdated availability.
* Payment requests should provide a clear result without creating duplicate orders.
* The system should remain responsive during a popular concert sale.

#### Correctness

* A seat must never be successfully sold to two customers.
* An order should only be marked as paid after the payment provider confirms payment.
* Expired seat holds must become available again.
* Ticket and payment records must remain consistent.

#### Fairness

Fairness is particularly important during a popular concert sale.

* Customers should enter a virtual waiting room when demand exceeds the safe processing capacity.
* Requests should be processed approximately in arrival order.
* A customer should not be able to repeatedly refresh the website to gain an unfair advantage.
* Each user should have a reasonable limit on the number of seats they can purchase.
* The system should prevent automated clients from overwhelming the ticketing process.

#### Availability

* The website should continue operating if one application server fails.
* Important data should be stored in a replicated database.
* Failed requests should be recoverable where possible.

#### Security

* Passwords must be securely hashed.
* Authentication tokens must be protected.
* Users should only be able to access their own orders and tickets.
* Payment card information should not be stored directly by TicketHub.
* APIs should use HTTPS.
* Rate limiting should protect the system from abuse.

---

# 2. Traffic and Capacity Estimates

TicketHub has:

* 2,000,000 registered users
* 50,000 visitors per normal day
* 10 pages viewed per visitor
* 5,000 tickets sold per normal day
* 200,000 people attempting to buy 20,000 seats during the first 10 minutes of a popular concert sale

## Normal Traffic

### Daily page views

50,000 visitors × 10 pages each:

**500,000 page views/day**

### Average page requests per second

500,000 / 86,400 seconds:

**≈ 5.8 page requests/second**

The average is therefore approximately **6 requests per second**.

However, real traffic is not evenly distributed throughout the day. If we design for approximately 10 times the average normal traffic, the system should comfortably handle around:

**60 requests/second**

### Normal ticket sales

5,000 tickets/day means:

5,000 / 86,400

**≈ 0.058 ticket sales/second**

Ticket sales are therefore much less frequent than page views on a normal day.

---

# Big Concert Sale

During a popular concert sale:

* 200,000 people attempt to buy tickets.
* There are only 20,000 seats.
* The attempts happen within 10 minutes.

### Purchase attempts per second

10 minutes = 600 seconds.

200,000 / 600:

**≈ 333 purchase attempts/second**

This is approximately **57 times the normal average page-request rate** of 5.8 requests/second.

There may also be browsing, seat-map requests, login requests and payment requests.

For capacity planning, assume each purchase attempt produces approximately 5 backend requests during the buying process.

333 × 5:

**≈ 1,665 API requests/second**

Therefore, the system should be designed to handle at least approximately **1,700 requests/second** during the big sale, with additional headroom.

### Comparison

| Metric                     |          Normal Day |                                     Big Sale |
| -------------------------- | ------------------: | -------------------------------------------: |
| Visitors/attempting buyers |          50,000/day |                        200,000 in 10 minutes |
| Page views                 |         500,000/day |                    Concentrated into minutes |
| Average requests           |              ~6/sec |                   ~333 purchase attempts/sec |
| Estimated API traffic      |           ~6–60/sec |                                   ~1,700/sec |
| Tickets                    |           5,000/day |                                 20,000 seats |
| Main problem               | Normal availability | Extreme traffic + fairness + seat contention |

The big sale is therefore the main capacity challenge.

---

# 3. API Design

The API uses REST-style endpoints.

## 1. Browse Events

```http
GET /api/events
```

Returns a list of upcoming events.

Example:

```json
{
  "events": [
    {
      "id": 101,
      "name": "Summer Music Festival",
      "date": "2026-12-20",
      "venue": "Kampala Arena"
    }
  ]
}
```

## 2. View an Event

```http
GET /api/events/{eventId}
```

Returns event information including venue, date, time and ticket information.

## 3. View Seats

```http
GET /api/events/{eventId}/seats
```

Returns the seats and their current status.

Example:

```json
{
  "seats": [
    {
      "id": 1001,
      "section": "A",
      "row": "A",
      "number": 1,
      "status": "available"
    },
    {
      "id": 1002,
      "section": "A",
      "row": "A",
      "number": 2,
      "status": "sold"
    }
  ]
}
```

## 4. Hold Seats

```http
POST /api/events/{eventId}/holds
```

Request:

```json
{
  "seat_ids": [1001, 1002]
}
```

The server attempts to reserve the seats temporarily.

A successful response might be:

```json
{
  "hold_id": "H12345",
  "expires_at": "2026-12-20T18:05:00Z"
}
```

A hold should expire after a short period, for example 5 minutes.

## 5. Make Payment

```http
POST /api/orders/{orderId}/payment
```

The payment service processes the payment.

A successful response:

```json
{
  "order_id": 5001,
  "status": "paid"
}
```

The payment endpoint should support an idempotency key so that retrying the same payment request does not create duplicate orders.

## 6. View My Tickets

```http
GET /api/me/tickets
```

Returns tickets belonging to the authenticated user.

## 7. View an Order

```http
GET /api/orders/{orderId}
```

Returns order details and payment status.

---

# 4. Data Model

The system can use a relational database such as PostgreSQL or MySQL.

The main tables are:

* `users`
* `events`
* `seats`
* `orders`
* `order_items`

## Users

```text
users
-----
id PRIMARY KEY
name
email UNIQUE
password_hash
created_at
```

One user can create many orders.

Relationship:

```text
User 1 ────────< Orders
```

## Events

```text
events
------
id PRIMARY KEY
name
description
venue
event_date
created_at
```

One event has many seats.

Relationship:

```text
Event 1 ────────< Seats
```

## Seats

```text
seats
-----
id PRIMARY KEY
event_id FOREIGN KEY -> events.id
section
row_number
seat_number
status
price
```

A seat belongs to one event.

A database constraint should ensure that a physical seat position is unique within an event:

```text
UNIQUE(event_id, section, row_number, seat_number)
```

## Orders

```text
orders
------
id PRIMARY KEY
user_id FOREIGN KEY -> users.id
event_id FOREIGN KEY -> events.id
status
total_amount
created_at
paid_at
```

An order belongs to one user and one event.

One user can have many orders.

## Order Items

```text
order_items
-----------
id PRIMARY KEY
order_id FOREIGN KEY -> orders.id
seat_id FOREIGN KEY -> seats.id
price
```

An order can contain multiple seats.

The relationships are:

```text
Users
  |
  | 1-to-many
  v
Orders
  |
  | 1-to-many
  v
Order Items
  |
  | many-to-one
  v
Seats
  |
  | many-to-one
  v
Events
```

---

# 5. Preventing Double-Booking

Preventing double-booking is the most important correctness requirement.

Two customers may attempt to buy the same seat at almost exactly the same time.

For example:

```text
Customer A -----> Seat A1
Customer B -----> Seat A1
```

The system must allow only one transaction to succeed.

## Database Transaction

When a customer requests a seat hold, the application starts a database transaction.

Conceptually:

```sql
BEGIN;

SELECT *
FROM seats
WHERE id = 1001
FOR UPDATE;
```

`FOR UPDATE` locks the selected seat while the transaction is running.

The application then checks whether the seat is available.

If it is available:

```sql
UPDATE seats
SET status = 'held'
WHERE id = 1001;
```

The hold is recorded and the transaction commits:

```sql
COMMIT;
```

If another customer tries to hold the same seat at the same time, their transaction must wait for the first transaction to finish. When it gets the lock, it sees that the seat is no longer available and fails the request.

## Database Constraints

The database should also enforce uniqueness.

For example:

```sql
UNIQUE(event_id, section, row_number, seat_number)
```

This prevents duplicate physical seats from being created for the same event.

For orders, a unique constraint or equivalent database rule should prevent the same seat from being attached to two active/successful orders.

The application should therefore use **both application logic and database constraints**.

The database is the final authority because application-only checks can suffer from race conditions.

## Seat Hold Expiration

A held seat should have an expiration time.

For example:

```text
Seat A1
Status: HELD
Held until: 18:05
```

If the customer does not pay before the expiration time, a background job changes the seat back to:

```text
AVAILABLE
```

This allows another customer to purchase it.

---

# 6. Architecture

```text
                         ┌─────────────────────┐
                         │       Users         │
                         │ Web / Mobile        │
                         └──────────┬──────────┘
                                    │
                                    v
                         ┌─────────────────────┐
                         │ CDN / Load Balancer │
                         └──────────┬──────────┘
                                    │
                         ┌──────────v──────────┐
                         │   Waiting Room /    │
                         │    Rate Limiter     │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   v                v                v
             ┌──────────┐     ┌──────────┐     ┌──────────┐
             │ App      │     │ App      │     │ App      │
             │ Server 1 │     │ Server 2 │     │ Server 3 │
             └────┬─────┘     └────┬─────┘     └────┬─────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                    ┌──────────────v──────────────┐
                    │       Application API       │
                    └───────┬─────────┬───────────┘
                            │         │
                  ┌─────────v───┐ ┌──v───────────┐
                  │ Redis Cache │ │ Message Queue│
                  └─────────┬───┘ └──────┬───────┘
                            │            │
                            │            v
                            │     ┌───────────────┐
                            │     │ Background    │
                            │     │ Workers       │
                            │     └───────────────┘
                            │
                    ┌───────v────────┐
                    │   Database     │
                    │ Primary +      │
                    │ Read Replicas  │
                    └───────┬────────┘
                            │
                            v
                    ┌───────────────┐
                    │ Payment       │
                    │ Provider      │
                    └───────────────┘
```

## Component Explanation

### Users

Customers access TicketHub through a web browser or mobile application.

### CDN

A Content Delivery Network serves static files such as images, CSS and JavaScript close to users.

This reduces the load on application servers.

### Load Balancer

The load balancer distributes requests across multiple application servers.

If one application server fails, requests can be sent to another server.

### Waiting Room

The waiting room is especially important during a popular concert sale.

Instead of allowing 200,000 customers to directly hit the seat database at the same time, users enter a controlled queue.

Only a safe number of users are allowed to proceed to the purchase process.

This protects the database and improves fairness.

### Rate Limiter

The rate limiter prevents one user or automated program from sending thousands of requests.

### Application Servers

Multiple application servers run the TicketHub API.

They are stateless, meaning another server can handle a request if one server fails.

### Redis Cache

Redis can cache frequently requested information such as event details and general seat-map information.

This reduces repeated database reads.

However, the cache must not be treated as the final authority for whether a seat is actually available.

The database remains authoritative for seat ownership.

### Message Queue

A message queue handles tasks that do not need to happen during the customer's immediate request.

Examples include:

* Sending ticket emails.
* Sending notifications.
* Processing expired holds.
* Generating reports.

### Database

The relational database stores users, events, seats, orders and payments.

Transactions and constraints protect the correctness of ticket sales.

A primary database handles writes while read replicas can handle large numbers of read requests.

### Payment Provider

TicketHub sends payment requests to an external payment provider.

TicketHub should not store customers' full payment card details.

---

# 7. How the Architecture Survives the Big Sale

The biggest problem is that 200,000 people attempt to purchase only 20,000 seats.

The system uses several protections.

### 1. Virtual Waiting Room

Customers are placed into a queue before accessing the purchase flow.

This prevents all 200,000 users from simultaneously performing expensive database operations.

### 2. Horizontal Scaling

Multiple application servers can run at the same time.

The load balancer distributes requests between them.

### 3. Caching

Event information and other frequently requested read-only data can be cached.

This prevents repeated requests from reaching the database.

### 4. Database Transactions

Seat reservations use transactions and row-level locking.

Only one transaction can successfully claim a particular seat.

### 5. Rate Limiting

Customers cannot continuously refresh the seat page or send unlimited purchase requests.

### 6. Background Processing

Email notifications and other non-critical work are placed into a queue instead of slowing down the purchase request.

### 7. Database Read Replicas

Read-heavy operations can be distributed across replicas while critical seat and order writes remain on the primary database.

---

# 8. Trade-Offs

## Trade-Off 1: Fairness vs Simplicity

A simple system could allow everyone to immediately access the purchase page.

This would be easier to build, but it would be unfair and could overload the database.

A virtual waiting room adds complexity but gives customers a more controlled and fair purchasing experience.

**Decision:** Use the waiting room because fairness and reliability are more important during major ticket releases.

## Trade-Off 2: Strong Consistency vs Performance

Strong database transactions and locking provide excellent protection against double-booking, but they can reduce throughput when many customers attempt to purchase the same seats.

Caching is faster but can contain slightly outdated information.

**Decision:** Use caching for general browsing but use the transactional database as the source of truth for seat ownership.

## Trade-Off 3: Infrastructure Cost vs Reliability

Running multiple application servers, database replicas, Redis and a message queue costs more than running one server.

However, the larger infrastructure can survive failures and traffic spikes.

**Decision:** Use scalable infrastructure because TicketHub has unpredictable traffic during major concert releases.

---

# 9. Summary

TicketHub needs a system that is not only fast but also correct and fair.

Normal traffic is approximately 6 page requests per second on average, while a major sale can create approximately 333 purchase attempts per second and potentially around 1,700 API requests per second.

The architecture therefore uses a load balancer, multiple application servers, caching, a virtual waiting room, rate limiting, a message queue and a relational database.

The most important correctness mechanism is transactional seat reservation. Database locking and constraints ensure that two customers cannot successfully purchase the same seat.

The system sacrifices some simplicity and infrastructure cost in exchange for reliability, fairness and correctness during high-demand ticket sales.
