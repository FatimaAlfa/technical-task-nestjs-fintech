## API Documentation

Once the server is running, visit [http://localhost:3050/api](http://localhost:3050/api) to view the Swagger UI.

**Authentication:**  
Swagger UI is protected by Basic Auth. Default credentials:

- **Username:** `fatima`
- **Password:** `fatima123`

## API Endpoints Overview

- `POST /user` - Register a new user (public)

- `POST /user/login` - Login and get JWT token
  - **NOTE** JWT tokens are stored and managed using cookies for secure authentication.

- `GET /user` - List all users (admin route)

**Merchants:**

- `POST /merchant` - Create merchant (admin only)

- `GET /merchant/:id` - Get merchant details (admin or merchant of the profile)

- `PATCH /merchant/:id` - Update merchant (admin or merchant of the profile)

**Transactions:**

- `POST /transaction` - Create a transaction (merchant associated with transaction or partner)

- `PATCH /transaction/:id/approve` - Approve transaction (merchant associated with transaction)

- `PATCH /transaction/:id/decline` - Decline transaction (merchant associated with transaction)

- `GET /transaction/merchant/:merchantId` - Get transactions by merchant Id (merchant associated with transaction)

**Audit Logs:**

- `GET /audit-log`- Get audit logs(admin only)

**NOTES**

- CORS is currently set to only allow `localhost:3050` - update this in `main.ts` if needed
- Cookie parser is used for JWT tokens
- all dtos' body are presented on swagger
