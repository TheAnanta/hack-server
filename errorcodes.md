# API Error Codes

This document lists the standardized error codes used in the API responses.

## Format
All error responses will follow this structure:
```json
{
  "status": false,
  "message": "Human readable error message",
  "error_code": "category/specific-error"
}
```

## Auth Errors
- `auth/missing-token`: Authorization header missing.
- `auth/invalid-token`: Token verification failed.
- `auth/user-not-found`: User profile does not exist.
- `auth/forbidden`: Insufficient permissions.

## Request Errors
- `request/missing-payload`: Required fields are missing.
- `request/invalid-payload`: Data format is incorrect.
- `request/not-found`: Requested resource not found.

## Logic Errors
- `logic/team-full`: Team has reached maximum capacity.
- `logic/already-in-team`: User is already in a team.
- `logic/not-in-team`: User must be in a team to perform this action.
- `logic/event-not-found`: Event does not exist.
- `logic/payment-failed`: Payment initiation failed.

## Server Errors
- `server/internal-error`: Unexpected server error.
