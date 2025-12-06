# Hackathon Server

Backend for the Hackathon Management System.

## Features
- **Authentication**: Firebase Auth integration.
- **RBAC**: Role-based access control with granular permissions.
- **Workflows**:
    - **Registration**: User profiles, Team formation, Event registration.
    - **Problem Statements**: Org submission, Admin approval.
    - **Admin Panel**: Event management, Check-in/out, Analytics.
    - **Payments**: Razorpay integration.
    - **Judging**: Score submission, Leaderboard.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create `.env` file:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/hackathon"
    PORT=3000
    RAZORPAY_KEY_ID="your_key"
    RAZORPAY_KEY_SECRET="your_secret"
    RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
    # Firebase credentials (if using default, ensure GOOGLE_APPLICATION_CREDENTIALS is set)
    ```

3.  **Database**
    ```bash
    npx prisma migrate dev
    ```

4.  **Run Server**
    ```bash
    npm run dev
    ```

## API Documentation

All API responses follow a standard format:
```json
{
  "status": true, // or false
  "data": { ... }, // on success
  "message": "...", // on success or error
  "error_code": "category/error" // on error
}
```

### 1. Authentication (`/auth`)

#### POST `/auth/signup`
Creates a new user profile after Firebase Authentication.
- **Headers**: `Authorization: Bearer <firebase_token>` (Optional for this specific route if handled by client, but usually required for context)
- **Body**:
    - `uuid` (string, required): Firebase UID.
    - `name` (string, required)
    - `email` (string, required)
    - `roll_number` (string, required)
    - `role_id` (string, required): ID of the role (e.g., 'student').
    - `year_of_study` (number, required)
    - `branch` (string, required)
    - `department` (string, required)
    - `college_id` (string, required)
    - `profile_picture` (string, required)
    - `phone_number` (string, required)

### 2. Users (`/users`)

#### GET `/users/me`
Get current user's profile.
- **Headers**: `Authorization: Bearer <firebase_token>`

#### PUT `/users/me`
Update current user's profile.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Body**:
    - `name`, `roll_number`, `year_of_study`, `branch`, `department`, `college_id`, `profile_picture`, `phone_number` (all optional)

#### GET `/users`
List all users.
- **Headers**: `Authorization: Bearer <firebase_token>`

### 3. Teams (`/teams`)

#### POST `/teams`
Create a new team. The creator becomes the Team Leader.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Body**:
    - `team_name` (string, required)
    - `problem_statement_id` (string, required)
    - `events_id` (string, required)

#### POST `/teams/join`
Join an existing team.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Body**:
    - `team_id` (string, required)

#### GET `/teams/:id`
Get details of a specific team.
- **Headers**: `Authorization: Bearer <firebase_token>`

#### PUT `/teams/:id`
Update team details (Team Leader only).
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Body**:
    - `team_name`, `problem_statement_id`, `github_link`, `demo_link`

### 4. Events (`/events`)

#### GET `/events`
List all available events.

#### POST `/events/:id/register`
Register the current user for an event (Individual).
- **Headers**: `Authorization: Bearer <firebase_token>`

#### POST `/events` (Admin)
Create a new event.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `create_event`
- **Body**:
    - `name`, `college_id`, `start_date`, `end_date`, `description`

#### PUT `/events/:id` (Admin)
Update an event.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `update_event`

#### POST `/events/:id/organizers` (Admin)
Assign an organizer to an event.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `manage_organizers`
- **Body**:
    - `user_id` (string, required)

#### DELETE `/events/:id/organizers/:userId` (Admin)
Remove an organizer from an event.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `manage_organizers`

### 5. Organizations (`/orgs`)

#### POST `/orgs`
Create a new organization.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `create_org`
- **Body**:
    - `name`, `bio`, `logo`

#### PUT `/orgs/:id`
Update an organization.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `update_org`

### 6. Problem Statements (`/problems`)

#### POST `/problems`
Submit a problem statement.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `submit_problem`
- **Body**:
    - `title`, `description`, `track`, `organization_id`

#### PUT `/problems/:id/approve` (Admin)
Approve a problem statement.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Permission**: `approve_problem`

#### GET `/problems`
List all approved problem statements.

### 7. Admin Panel (`/admin`)

#### GET `/admin/teams/:id/users`
Get all users in a specific team.
- **Permission**: `view_teams`

#### GET `/admin/rooms/:id/teams`
Get all teams assigned to a specific room.
- **Permission**: `view_rooms`

#### POST `/admin/users/:id/checkin`
Check-in a user.
- **Permission**: `manage_checkin`

#### GET `/admin/analytics`
Get system analytics (user count, team count, etc.).
- **Permission**: `view_analytics`

### 8. Payments (`/payments`)

#### POST `/payments/checkout`
Initiate a Razorpay checkout.
- **Headers**: `Authorization: Bearer <firebase_token>`
- **Body**:
    - `amount` (number, required)
    - `currency` (string, default: "INR")

#### POST `/payments/webhook`
Handle Razorpay webhooks.
- **Headers**: `x-razorpay-signature`

#### POST `/admin/payments/confirm` (Admin)
Manually confirm a payment.
- **Permission**: `manage_payments`
- **Body**:
    - `payment_id` (string, required)

### 9. Judging (`/judging`)

#### GET `/judging/assignments`
Get teams assigned to the judge (or all teams if no specific assignment).
- **Permission**: `judge_teams`

#### POST `/judging/score`
Submit a score for a team.
- **Permission**: `judge_teams`
- **Body**:
    - `team_id`, `innovation`, `feasibility`, `tech_stack`, `presentation`, `creativity`, `implementation`, `comments`

#### GET `/judging/scores/:teamId`
Get all scores for a team.
- **Permission**: `view_scores`

#### PUT `/judging/scores/:id`
Update a submitted score.
- **Permission**: `judge_teams`

### 10. Results (`/results`)

#### GET `/results/leaderboard`
Get the public leaderboard (ranked by average score).

#### GET `/results/teams/:id`
Get individual results for a team.
- **Headers**: `Authorization: Bearer <firebase_token>`
