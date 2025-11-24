# 🌟 Trustpilot Automated Review Collection - Complete Guide

## Overview

Automated system to collect, sync, and display Trustpilot reviews on your platform. Reviews are automatically synced every 6 hours and can be manually triggered by admins.

## ✅ What's Implemented

### 1. **Backend Components**

-   **`backend/src/jobs/trustpilotCollector.ts`** - Core review collection service
    -   Fetches reviews from Trustpilot API
    -   Syncs to local database
    -   Filters for 5-star reviews only (best positive feedback)
    -   Auto-publishes 5-star reviews
    -   Provides statistics and analytics

-   **`backend/src/routes/trustpilot.ts`** - API endpoints
    -   `GET /api/trustpilot/reviews` - Public endpoint for published reviews
    -   `GET /api/trustpilot/stats` - Review statistics (average rating, counts)
    -   `POST /api/trustpilot/sync` - Manual sync trigger (admin only)
    -   `GET /api/trustpilot/admin/all` - All reviews (admin only)
    -   `PATCH /api/trustpilot/admin/:id/publish` - Publish/unpublish review (admin only)
    -   `DELETE /api/trustpilot/admin/:id` - Delete review (admin only)

-   **Database Model** - `TrustpilotReview` in Prisma schema

  ```prisma
  model TrustpilotReview {
    id            String    @id @default(uuid())
    trustpilotId  String    @unique
    stars         Int
    title         String?
    text          String    @db.Text
    reviewerName  String
    isVerified    Boolean   @default(false)
    isPublished   Boolean   @default(false)
    reviewDate    DateTime
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
  }
  ```

-   **Automated Scheduling** - Integrated with RPA Scheduler
    -   Runs every 6 hours automatically
    -   Can be manually triggered via API
    -   Logs all sync activities to audit trail

### 2. **Frontend Components**

-   **`frontend/src/components/TrustpilotWidget.tsx`** - Basic Trustpilot widget
    -   Simple star rating badge
    -   Minimal footprint
    -   Quick integration

-   **`frontend/src/components/TrustpilotWidgetEmbedded.tsx`** - Advanced widget with templates
    -   7 different widget templates (mini, micro, carousel, list, grid, quote, custom)
    -   Customizable height, width, theme
    -   Filter by star rating
    -   Dark/light theme support
    -   Your custom template IDs: `0bff66558872c58ed5b8b7942acc34d9`, `74ecde4d46d4b399c7295cf599d2886b`

-   **`frontend/src/components/TrustpilotWidgetShowcase.tsx`** - Widget gallery
    -   Visual showcase of all templates
    -   Copy-paste ready examples
    -   Recommended placements guide

-   **`frontend/src/components/TrustpilotReviews.tsx`** - Custom review display
    -   Grid layout of reviews
    -   Star ratings
    -   Verified badge
    -   Responsive design
    -   Loading states

### 3. **Configuration**

-   Environment variables added to `.env.example`:

  ```bash
  TRUSTPILOT_API_KEY=your_trustpilot_api_key
  TRUSTPILOT_BUSINESS_UNIT_ID=your_business_unit_id
  ```

-   Dependencies added to `package.json`:
    -   `node-cron` - For scheduling
    -   `@types/node-cron` - TypeScript types

## 🚀 Setup Instructions

### Step 1: Get Trustpilot API Credentials

1. Log in to [Trustpilot Business](https://businessapp.b2b.trustpilot.com/)
2. Go to **Integrations** → **API**
3. Create new API key
4. Copy your **API Key** and **Business Unit ID**

### Step 2: Configure Backend

1. Add to `backend/.env`:

   ```bash
   TRUSTPILOT_API_KEY=your_actual_api_key_here
   TRUSTPILOT_BUSINESS_UNIT_ID=your_business_unit_id_here
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Run database migration:

   ```bash
   npx prisma migrate dev --name add-trustpilot-reviews
   npx prisma generate
   ```

### Step 3: Configure Frontend

1. Add to `frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=your_business_unit_id_here
   NEXT_PUBLIC_TRUSTPILOT_DOMAIN=advanciapayledger.com
   ```

### Step 4: Test the System

1. **Start backend**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Test manual sync** (from another terminal):

   ```bash
   curl -X POST http://localhost:4000/api/trustpilot/sync \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
   ```

3. **View reviews**:

   ```bash
   curl http://localhost:4000/api/trustpilot/reviews
   ```

## 📊 Usage Guide

### For Developers

#### Display Reviews on Homepage

```tsx
import TrustpilotReviews from "@/components/TrustpilotReviews";

export default function HomePage() {
  return (
    <div>
      {/* Other content */}

      <TrustpilotReviews limit={6} showTitle={true} />
    </div>
  );
}
```

#### Display Official Widgets

**Option 1: Basic Widget (Simple)**

```tsx
import TrustpilotWidget from "@/components/TrustpilotWidget";

export default function Footer() {
  return (
    <footer>
      <TrustpilotWidget />
    </footer>
  );
}
```

**Option 2: Embedded Widget with Templates (Advanced)**

```tsx
import TrustpilotWidgetEmbedded from "@/components/TrustpilotWidgetEmbedded";

export default function HomePage() {
  return (
    <div>
      {/* Mini star widget in header */}
      <header>
        <TrustpilotWidgetEmbedded template="mini" height={24} width={150} />
      </header>

      {/* Carousel widget in hero section */}
      <section>
        <TrustpilotWidgetEmbedded template="carousel" height={350} width="100%" stars="5" theme="dark" />
      </section>

      {/* Quote widget for testimonials */}
      <section>
        <TrustpilotWidgetEmbedded template="quote" height={240} width="100%" />
      </section>

      {/* Use your custom template IDs */}
      <section>
        <TrustpilotWidgetEmbedded template="custom" customTemplateId="0bff66558872c58ed5b8b7942acc34d9" height={300} width="100%" />
      </section>
    </div>
  );
}
```

**Option 3: Widget Showcase Page**

```tsx
import TrustpilotWidgetShowcase from "@/components/TrustpilotWidgetShowcase";

export default function WidgetsPage() {
  return <TrustpilotWidgetShowcase />;
}
```

### For Admins

#### Manual Sync via API

```bash
# Trigger sync
curl -X POST https://api.advanciapayledger.com/api/trustpilot/sync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Response
{
  "success": true,
  "message": "Synced 25 reviews with 0 errors",
  "stats": {
    "total": 125,
    "averageRating": 4.8,
    "fiveStar": 100,
    "fourStar": 25
  }
}
```

#### View All Reviews (Admin Panel)

```bash
curl https://api.advanciapayledger.com/api/trustpilot/admin/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Publish/Unpublish a Review

```bash
curl -X PATCH https://api.advanciapayledger.com/api/trustpilot/admin/:reviewId/publish \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPublished": true}'
```

#### Delete a Review

```bash
curl -X DELETE https://api.advanciapayledger.com/api/trustpilot/admin/:reviewId \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🔄 Automated Scheduling

### How It Works

The system uses the existing RPA scheduler infrastructure:

1. **Automatic Start**: When `RPA_AUTO_START=true` in `.env`
2. **Schedule**: Every 6 hours (0 _/6_ \* \*)
3. **Process**:
   -   Fetch latest 50 reviews from Trustpilot
   -   Filter for 5-star reviews only
   -   Check for duplicates (by `trustpilotId`)
   -   Insert new reviews or update existing
   -   Auto-publish 5-star reviews
   -   Log activity to audit trail

### Manual Trigger

From backend code:

```typescript
import rpaScheduler from "./rpa/scheduler";

// Trigger trustpilot sync
await rpaScheduler.runTask("trustpilotSync");
```

From command line:

```bash
curl -X POST http://localhost:4000/api/rpa/run/trustpilotSync \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📈 Monitoring

### Check Sync Status

```bash
# View audit logs
curl https://api.advanciapayledger.com/api/admin/audit-logs?action=TRUSTPILOT_SYNC \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Statistics

```bash
curl https://api.advanciapayledger.com/api/trustpilot/stats
```

Example response:

```json
{
  "success": true,
  "stats": {
    "total": 125,
    "published": 125,
    "averageRating": 4.8,
    "fiveStar": 100,
    "fourStar": 25
  }
}
```

## 🔒 Security

-   **API Authentication**: Trustpilot API key stored securely in env vars
-   **Admin Only**: Sync triggers and management require admin role
-   **Rate Limiting**: Respects Trustpilot API rate limits
-   **Audit Trail**: All sync activities logged
-   **Data Validation**: Reviews validated before storage

## 🎯 Best Practices

### Review Moderation

1. **Auto-publish 5-star only**: Only 5-star reviews are auto-published
2. **Manual review for lower ratings**: 1-4 star reviews remain unpublished
3. **Monitor regularly**: Check admin panel weekly
4. **Respond on Trustpilot**: Engage with customers on Trustpilot directly

### Display Strategy

1. **Homepage**: Show 6 most recent reviews
2. **About/Trust Page**: Show all published reviews with pagination
3. **Footer**: Display Trustpilot widget for credibility
4. **Checkout**: Show widget to build trust during purchase

### Sync Frequency

-   **Default**: Every 6 hours (good for most businesses)
-   **High Volume**: Every 2 hours if you get many reviews
-   **Low Volume**: Daily if reviews are rare

Adjust in `backend/src/rpa/scheduler.ts`:

```typescript
// Change from:
"0 */6 * * *"; // Every 6 hours

// To:
"0 */2 * * *"; // Every 2 hours
// or
"0 0 * * *"; // Daily at midnight
```

## 🐛 Troubleshooting

### No Reviews Syncing

1. **Check API credentials**:

   ```bash
   echo $TRUSTPILOT_API_KEY
   echo $TRUSTPILOT_BUSINESS_UNIT_ID
   ```

2. **Check logs**:

   ```bash
   # Backend logs
   tail -f backend/logs/combined.log | grep Trustpilot
   ```

3. **Test API manually**:

   ```bash
   curl "https://api.trustpilot.com/v1/business-units/YOUR_BUSINESS_UNIT_ID/reviews" \
     -H "apikey: YOUR_API_KEY"
   ```

### Reviews Not Displaying

1. **Check database**:

   ```bash
   cd backend
   npx prisma studio
   # Navigate to TrustpilotReview table
   ```

2. **Check `isPublished` field**: Only published reviews show on frontend

3. **Check frontend API URL**:

   ```bash
   echo $NEXT_PUBLIC_API_URL
   ```

### Sync Failing

1. **Check rate limits**: Trustpilot has API rate limits
2. **Check Business Unit ID**: Must match your Trustpilot account
3. **Check API key permissions**: Key must have read access to reviews

## 📚 API Reference

### Public Endpoints

#### GET `/api/trustpilot/reviews`

Fetch published reviews.

**Query Parameters:**

-   `limit` (optional): Number of reviews (default: 10)
-   `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "reviews": [...],
  "pagination": {
    "total": 125,
    "limit": 10,
    "offset": 0
  }
}
```

#### GET `/api/trustpilot/stats`

Get review statistics.

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": 125,
    "published": 125,
    "averageRating": 4.8,
    "fiveStar": 100,
    "fourStar": 25
  }
}
```

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_jwt_token>`

#### POST `/api/trustpilot/sync`

Manually trigger review sync.

#### GET `/api/trustpilot/admin/all`

Get all reviews (including unpublished).

#### PATCH `/api/trustpilot/admin/:id/publish`

Publish or unpublish a review.

**Body:**

```json
{
  "isPublished": true
}
```

#### DELETE `/api/trustpilot/admin/:id`

Delete a review from database.

## 🎉 Next Steps

1. **Get Trustpilot credentials** from your business account
2. **Configure environment variables** in backend and frontend
3. **Run database migration** to create the reviews table
4. **Trigger initial sync** to populate reviews
5. **Add review components** to your pages
6. **Monitor sync logs** to ensure everything works

## 📞 Support

-   **Trustpilot API Docs**: <https://documentation-apidocumentation.trustpilot.com/>
-   **Trustpilot Support**: <https://support.trustpilot.com/>
-   **Internal Issues**: Check backend logs and audit trail

---

**Status**: ✅ Ready for Production

**Last Updated**: November 18, 2025
