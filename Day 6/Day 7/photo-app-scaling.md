# SnapShare Photo App Scaling Plan

## 1. Assumptions

The following assumptions are used for the scaling calculations:

* SnapShare has 10 million registered users.
* 10% of registered users are active each day.
* Each active user uploads 1 photo per day.
* Each active user views 50 feed pages per day.
* The average original photo is 2 MB.
* Each photo also has a 50 KB thumbnail.
* There are 86,400 seconds in a day.
* A year is assumed to have 365 days.
* Peak traffic is estimated at 5 times the average traffic.
* Storage calculations use decimal units: 1 MB = 1,000,000 bytes and 1 TB = 1,000 GB.

### Daily Active Users

10,000,000 registered users × 10% active users

= **1,000,000 daily active users**

---

## 2. Traffic and Storage Estimates

### Uploads per Second

There are 1,000,000 photo uploads per day.

1,000,000 ÷ 86,400 = **11.57 uploads per second**

Therefore, SnapShare handles approximately **12 uploads per second on average**.

### Feed Views per Second

Each daily active user views 50 feed pages per day.

1,000,000 × 50 = **50,000,000 feed views per day**

50,000,000 ÷ 86,400 = **578.7 feed views per second**

Therefore, the average feed traffic is approximately **579 feed views per second**.

For peak traffic, assuming 5 times the average:

578.7 × 5 = **2,893.5 feed views per second**

Therefore, peak feed traffic is approximately **2,894 feed views per second**.

### Photo Storage per Year

Each day, 1,000,000 original photos are uploaded.

Original photo storage:

1,000,000 × 365 × 2 MB

= 730,000,000 MB

= **730 TB per year**

Thumbnail storage:

1,000,000 × 365 × 50 KB

= **18.25 TB per year**

Total photo and thumbnail storage:

730 TB + 18.25 TB

= **748.25 TB per year**

Therefore, SnapShare requires approximately **748.25 TB of new photo and thumbnail storage per year**, excluding backups, replication and other storage overhead.

---

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

There are approximately 11.57 photo uploads per second but approximately 578.7 feed views per second on average.

This means the system performs far more read operations than write operations.

The design should therefore focus heavily on making reads fast and scalable. A cache, CDN and database read replica can reduce the amount of work performed by the application servers and primary database.

At peak traffic, the system should be capable of handling approximately 2,894 feed views per second.

---

## 4. Why Photos Should Not Be Stored Inside the Database

The actual photo files should not be stored directly inside the main database.

Storing hundreds of terabytes of large binary files in the database would make database storage expensive and could make backups, replication and database operations slower.

Instead, the original photos and thumbnails should be stored in **object storage**.

The database should store metadata such as:

* Photo ID
* User ID
* Object storage location
* Caption
* Upload time
* Thumbnail location
* Other information needed to build the feed

Object storage is designed to store large amounts of files efficiently and can scale to very large storage requirements.

A CDN can then cache and deliver frequently requested photos and thumbnails closer to users.

---

## 5. SnapShare Architecture Diagram

```text
                         USERS
                           |
                           v
                    +--------------+
                    |     CDN      |
                    | Photos/      |
                    | Thumbnails   |
                    +--------------+
                           |
                           v
                 +-------------------+
                 |  LOAD BALANCER    |
                 +-------------------+
                    /       |       \
                   /        |        \
                  v         v         v
          +-----------+ +-----------+ +-----------+
          | App       | | App       | | App       |
          | Server 1  | | Server 2  | | Server N  |
          +-----------+ +-----------+ +-----------+
                 |          |          |
                 +----------+----------+
                            |
             +--------------+--------------+
             |                             |
             v                             v
      +-------------+              +---------------+
      |    CACHE    |              |    QUEUE      |
      |             |              |               |
      +-------------+              +---------------+
             |                             |
             |                             v
             |                    +----------------+
             |                    | Thumbnail      |
             |                    | Worker         |
             |                    +----------------+
             |                             |
             |                             v
             |                    +----------------+
             |                    | Object Storage |
             |                    | Photos +       |
             |                    | Thumbnails     |
             |                    +----------------+
             |
             v
      +----------------+
      | Primary        |
      | Database       |
      +----------------+
             |
             v
      +----------------+
      | Read Replica   |
      +----------------+
```

---

## 6. Components and the Problems They Solve

### CDN

The CDN delivers photos and thumbnails from locations closer to users, reducing latency and reducing the amount of traffic reaching the application servers.

### Load Balancer

The load balancer distributes incoming requests across multiple application servers so that one server does not become overloaded.

### App Servers

The application servers handle business logic such as authentication, uploading photos, creating feeds, following users and requesting photo metadata.

### Cache

The cache stores frequently accessed information such as popular feed data and photo metadata, reducing repeated requests to the database and improving response times.

### Primary Database

The primary database stores structured application data such as users, follows, posts, captions and photo metadata, and handles database writes.

### Read Replica

The read replica handles database read requests so that large numbers of feed requests do not overload the primary database.

### Object Storage

Object storage stores the large original photo files and thumbnails because it is designed to handle large amounts of file data efficiently.

### Queue

The queue holds background jobs, such as requests to create thumbnails, so that photo uploads do not have to wait for slow processing tasks to finish.

### Thumbnail Worker

The thumbnail worker consumes jobs from the queue, creates smaller versions of uploaded photos and saves the thumbnails to object storage.

---

## 7. Photo Upload Flow

When a user uploads a photo, the process works as follows:

1. The user selects a photo in the SnapShare application.
2. The request reaches the load balancer.
3. The load balancer sends the request to one of the application servers.
4. The application server authenticates the user and validates the upload.
5. The original photo is uploaded to object storage.
6. The application server creates a database record containing information about the photo, such as the user ID, photo ID and object storage location.
7. The application server places a thumbnail-generation job on the queue.
8. The application server can immediately respond to the user without waiting for thumbnail creation to finish.
9. A thumbnail worker takes the job from the queue.
10. The worker downloads or accesses the original photo from object storage.
11. The worker creates a 50 KB thumbnail.
12. The worker stores the thumbnail in object storage.
13. The worker updates the photo metadata with the thumbnail location if necessary.
14. When users view the feed, the application retrieves the required metadata and the CDN delivers the photo or thumbnail efficiently.

---

## 8. Trade-offs

### Trade-off 1: More Servers vs Cost

Adding more application servers improves scalability and availability because traffic can be distributed across multiple machines. However, running more servers increases infrastructure costs.

### Trade-off 2: Cache vs Data Freshness

Caching makes feed requests much faster and reduces database load. However, cached information can become temporarily outdated, meaning users might not immediately see the latest changes.

### Trade-off 3: Asynchronous Thumbnails vs Immediate Availability

Using a queue and background worker makes photo uploads faster because the user does not have to wait for thumbnail creation. However, the thumbnail may not be available immediately after the upload.

### Trade-off 4: Read Replica vs Consistency

A read replica improves read scalability and protects the primary database from heavy feed traffic. However, replicas can have a small delay before they contain the latest data written to the primary database.

---

## Conclusion

SnapShare is a read-heavy application because feed views greatly outnumber photo uploads. The architecture should therefore scale reads using a CDN, cache, multiple application servers and a database read replica.

Original photos and thumbnails should be stored in object storage rather than directly inside the database. A queue and thumbnail worker allow thumbnail creation to happen asynchronously without slowing down photo uploads.

The estimated system must support approximately **12 uploads per second**, **579 average feed views per second**, and approximately **2,894 peak feed views per second**. It also needs approximately **748.25 TB of new photo and thumbnail storage per year**, before accounting for backups and replication.
