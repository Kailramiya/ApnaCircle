# ApnaCircle — Database Schema

## 1. General conventions
- Use UUID primary keys.
- Use `timestamptz` for timestamps.
- Use foreign keys and explicit delete behavior.
- Add indexes for common filters and joins.
- Enforce uniqueness in PostgreSQL, not only in the UI.
- Enable RLS on tables exposed to the mobile client.
- Use `auth.uid()` in RLS policies to identify the authenticated user.
- Keep schema changes in versioned SQL migrations.

The schema below is a logical design. Before implementation, verify column names and policy behavior against the actual migration files.

## 2. Tables

### profiles
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key; references `auth.users(id)` |
| full_name | TEXT | Display name |
| username | TEXT | Unique username |
| avatar_url | TEXT | Nullable |
| bio | TEXT | Nullable |
| city | TEXT | User's selected city |
| locality | TEXT | Nullable |
| preferred_language | TEXT | Example: `en`, `hi` |
| created_at | TIMESTAMPTZ | Default current timestamp |
| updated_at | TIMESTAMPTZ | Default current timestamp |

### posts
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key; generated once per submission and reused on retry |
| user_id | UUID | References profiles |
| description | TEXT | Required post content |
| image_path | TEXT | Nullable Storage object path; resolve display URLs in the service layer |
| category | TEXT | Consider a constrained set or enum |
| city | TEXT | Location scope |
| locality | TEXT | Nullable |
| created_at | TIMESTAMPTZ | Default current timestamp |
| updated_at | TIMESTAMPTZ | Default current timestamp |

### likes
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| post_id | UUID | References posts |
| user_id | UUID | References profiles |
| created_at | TIMESTAMPTZ | Default current timestamp |

Required constraint: unique `(post_id, user_id)`.

### comments
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| post_id | UUID | References posts |
| user_id | UUID | References profiles |
| content | TEXT | Required |
| created_at | TIMESTAMPTZ | Default current timestamp |
| updated_at | TIMESTAMPTZ | Default current timestamp |

### saved_posts
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| post_id | UUID | References posts |
| user_id | UUID | References profiles |
| created_at | TIMESTAMPTZ | Default current timestamp |

Required constraint: unique `(post_id, user_id)`.

### jobs
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| title | TEXT | Job title |
| company_name | TEXT | Company |
| description | TEXT | Job description |
| salary_min | NUMERIC | Nullable |
| salary_max | NUMERIC | Nullable |
| employment_type | TEXT | Full-time, part-time, contract, etc. |
| city | TEXT | Job city |
| locality | TEXT | Nullable |
| created_at | TIMESTAMPTZ | Default current timestamp |

### job_applications
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| job_id | UUID | References jobs |
| user_id | UUID | References profiles |
| status | TEXT | Default `submitted`; constrain to this value for the MVP |
| created_at | TIMESTAMPTZ | Default current timestamp |

Required constraint: unique `(job_id, user_id)`. Duplicate apply requests return the existing row; clients cannot set another user's ID or advance status. Employer review/status updates are later work.

### saved_jobs
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| job_id | UUID | References jobs |
| user_id | UUID | References profiles |
| created_at | TIMESTAMPTZ | Default current timestamp |

Required constraint: unique `(job_id, user_id)`.

### notifications
| Column | Suggested type | Notes |
|---|---|---|
| id | UUID | Primary key |
| recipient_id | UUID | User receiving notification |
| actor_id | UUID | Actor profile reference; trusted backend determines the actor |
| type | TEXT | Constrained to `like` or `comment` for the MVP |
| post_id | UUID | Required post reference |
| comment_id | UUID | Required for `comment`; null for `like` |
| is_read | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Default current timestamp |

Notifications are secondary to core release flows. Create them from trusted backend logic for successful likes/comments on another user's post; derive recipients from post ownership. Define foreign-key delete behavior and prevent clients from fabricating events. Replies and application-update events require a later schema/workflow change.

## 3. Relationships
- `profiles.id` references `auth.users.id`.
- One profile can create many posts.
- A post can have many likes and comments.
- A user can like a post once.
- A user can save a post once.
- A user can save a job once.
- A user can apply to a job once.
- A user can receive many notifications.

## 4. Index recommendations
Consider indexes on:
- `posts(city, created_at DESC, id DESC)`
- `posts(category, created_at DESC, id DESC)`
- `posts(user_id, created_at DESC, id DESC)`
- `likes(post_id)`
- `comments(post_id, created_at DESC, id DESC)`
- `saved_posts(user_id, created_at DESC, id DESC)`
- `jobs(city, created_at DESC, id DESC)`
- `jobs(employment_type)`
- `job_applications(user_id, created_at DESC, id DESC)`
- `saved_jobs(user_id, created_at DESC, id DESC)`
- `notifications(recipient_id, created_at DESC, id DESC)`

Validate indexes against actual query patterns; do not add indexes blindly.

Newest-first lists use `ORDER BY created_at DESC, id DESC` and a strict `(created_at, id)` cursor comparison. Keep timestamp precision intact when constructing cursors. For saved lists, paginate using saved-record timestamps/IDs. Test equal timestamps across page boundaries; add locality/category composite indexes only if actual combined filters justify them.

## 5. RLS policy intent
Implement and test policies for at least the following:

### profiles
- Authenticated users can read the profile fields required by the product.
- A user can insert/update only their own profile row.
- A user cannot change another user's profile.

### posts
- Users can read posts allowed by the product's visibility rules.
- Authenticated users can create posts with their own `user_id`.
- A client-generated post UUID provides retry identity, never authorization. Enforce ownership for both new and existing rows.
- Only the owner can update or delete a post.

### likes
- Authenticated users can create/delete only their own likes.
- A user cannot create a like for another user.
- Unique constraint prevents duplicate likes.

### comments
- Users can read comments allowed by post visibility.
- Authenticated users can create comments with their own `user_id`.
- Only the comment owner can delete/update their comment.

### saved_posts and saved_jobs
- Users can read, insert, and delete only their own saved records.

### jobs
- Users can read the published demo listings; the MVP jobs table contains no unpublished drafts.
- Only an authorized administrative process can create/update/delete job listings.
- Do not assume hiding admin UI is sufficient authorization.

### job_applications
- Users can create applications only for themselves with status `submitted`.
- Users can read their own applications.
- Client status updates are not allowed. Any future status change requires an explicitly authorized workflow.

### notifications
- Recipients can read and mark their own notifications as read.
- Restrict client updates to `is_read` using column privileges or a narrow authorized operation; owning a row must not allow changing its actor, recipient, or event fields.
- Only trusted backend logic may create like/comment notifications; exclude self-actions.

## 6. Storage
Suggested buckets:
- `post-images`
- `profile-images`

Use storage policies to restrict uploads and modifications to authenticated owners. Decide whether objects are public or private based on product requirements. Do not expose private objects through unprotected URLs.

For post images, use an owner/post-specific object path and save it in `posts.image_path`. Keep it stable during retries. Reconcile the post by ID before cleanup after an uncertain response; delete only confirmed-unused uploads with no write still in flight. Record cleanup failures for retry/maintenance. Follow the full recovery contract in `API_DOCUMENTATION.md`; Storage and table mutations are not atomic.

## 7. Migration requirements
- Create schema through SQL migration files.
- Include constraints, indexes, RLS enablement, and policies.
- Keep seed data separate from production migrations.
- Test policies using multiple users, not only the project owner's account.
- Verify user A cannot edit user B's post or read B's saved content/applications, and repeated like/application requests preserve unique rows.

## 8. Development seed data
- Select and record one demonstration city with several localities, realistic categories, posts, and job listings.
- Clearly identify sample content and applications as demo data; do not imply employer delivery or real user activity.
- Include several hundred posts and records sharing timestamps for pagination and release-build scrolling checks. Record dataset size with device observations.
