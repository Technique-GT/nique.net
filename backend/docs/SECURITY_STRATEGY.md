# Security Strategy

## Authentication & Authorization

### Token Revocation Strategy
Currently, the application uses stateless JWTs (JSON Web Tokens) for authentication. While efficient, this makes immediate revocation (e.g., on logout or user ban) difficult before the token expires.

#### Recommended Implementation
To support immediate revocation, we recommend moving to a hybrid approach:

1.  **Short-Lived Access Tokens**: Reduce JWT expiry to 15 minutes.
2.  **Refresh Tokens**: Issue a long-lived refresh token (7 days) stored in an HTTP-only cookie.
3.  **Database Tracking**: Store a hash of the refresh token in the database.
4.  **Revocation**:
    *   **Logout**: Delete the refresh token from the database.
    *   **Ban/Password Reset**: Invalidate all refresh tokens for the user ID.
    *   **Access Token Validation**: The access token remains stateless, but clients must rotate it every 15 minutes using the refresh token, which checks the database.

#### Temporary Mitigation
Until the full architecture is implemented:
*   JWT expiry is set to 7 days (current).
*   **Logout** clears the client-side cookie but the token remains valid until expiry if stolen.
*   **Mitigation**: We have implemented strict CORS, Rate Limiting, and XSS protection to minimize token theft risks.

## CORS Policy
*   **Development**: Allows localhost and preview deployments.
*   **Production**: Strictly enforces `CLIENT_URL` and `APP_BASE_URL` matches. Block requests from unknown origins.

## Error Handling
*   **Production**: All 500-level errors are masked with generic messages ("Server error", "Error fetching data") to prevent leaking stack traces or database schemas.
*   **Development**: Full error details are returned for debugging.

## File Uploads
*   **Magic Byte Validation**: All uploaded files are checked against their content signature (magic bytes) to ensure the extension matches the actual content (e.g., preventing a PHP script renamed as .jpg).
