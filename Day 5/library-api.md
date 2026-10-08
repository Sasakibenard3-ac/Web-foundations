# Library Books REST API

## Overview

This API manages books in a library system.

The main resource is:

`/books`

---

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success Status:** `200 OK`

### Example Request

```http
GET /books