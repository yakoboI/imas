# Notification System Implementation

## Overview
Complete notification system implementation for the Inventory Management System, supporting Email, SMS, and Push notifications with user preferences and automated alerts.

## Features Implemented

### 1. Email Notifications ✅
- Enhanced existing `EmailService` with preference checking
- Templates for low stock alerts, order updates, and daily digests
- Respects user `emailNotifications` preference

### 2. SMS Notifications ✅
- New `SMSService` with Twilio integration support
- Development mode (logs instead of sending)
- Phone number validation
- Respects user `smsNotifications` preference

### 3. Push Notifications ✅
- Web Push API implementation
- Service Worker (`/public/sw.js`)
- VAPID key management
- Browser notification support
- Respects user `pushNotifications` preference

### 4. Low Stock Alerts ✅
- Automatic detection when inventory falls below reorder level
- Triggered after stock adjustments
- Prevents duplicate alerts (once per day)
- Sends to users with `lowStockAlerts` enabled

### 5. Order Update Notifications ✅
- Triggered on order status changes
- Sent when orders are created, updated, or completed
- Sends to users with `orderUpdates` enabled

### 6. Daily Report Digests ✅
- Scheduled job runs daily at 11 PM (configurable)
- Includes sales summary, orders summary, low stock items, pending tasks
- Sends to users with `reportDigests` enabled

## Database Tables Created

1. **push_subscriptions** - Stores browser push notification subscriptions
2. **notification_history** - Logs all notifications sent
3. **alert_tracking** - Tracks low stock alerts to prevent spam

## Backend Services

### Core Services
- `NotificationService` - Unified notification router
- `SMSService` - SMS sending via Twilio
- `PushNotificationService` - Web Push API management
- `DailyDigestService` - Report generation and sending
- `DigestScheduler` - Cron job for daily digests

### Controllers Updated
- `inventoryController.js` - Added low stock alert detection
- `orderController.js` - Added order update notifications
- `notificationController.js` - Push subscription management

## Frontend Components

### Services
- `notificationService.js` - API calls for notifications
- `pushNotifications.js` - Push subscription utilities

### Components Updated
- `NotificationSettings.jsx` - Enhanced with push subscription handling

### Service Worker
- `public/sw.js` - Handles push notifications and click events

## Environment Variables Required

### Email (Already configured)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@inventorysystem.com
```

### SMS (Optional - for Twilio)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_SEND_SMS=true  # Set to true to actually send SMS (default: false in dev)
```

### Push Notifications
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:admin@inventorysystem.com
```

**Note:** VAPID keys are auto-generated on first run if not set. Copy them from console output to `.env` file.

### Daily Digest Scheduler
```env
DIGEST_SCHEDULE=0 23 * * *  # Cron format (default: 11 PM daily)
RUN_DIGEST_ON_STARTUP=true  # Set to true for testing (optional)
```

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install web-push node-cron
```

### 2. Run Migration
```bash
node src/database/migrations/run-005-migration.js
```

### 3. Configure Environment Variables
Add the required environment variables to your `.env` file (see above).

### 4. Start Server
The digest scheduler will start automatically when the server starts.

## Usage

### User Preferences
Users can configure their notification preferences in:
**Profile → Notification Settings**

Options:
- ✅ Enable email notifications
- ✅ Enable SMS notifications  
- ✅ Enable push notifications
- ✅ Low stock alerts
- ✅ Order updates
- ✅ Daily report digests

### Testing Notifications (Development)

Test endpoints available in development mode:

```bash
# Test low stock alert
POST /api/notifications/test/low-stock

# Test order update
POST /api/notifications/test/order-update

# Test daily digest
POST /api/notifications/test/daily-digest
```

### Push Notification Setup

1. User enables push notifications in settings
2. Browser requests permission
3. Service worker registers
4. Subscription sent to backend
5. Notifications will be received when events occur

## How It Works

### Low Stock Alerts
1. User adjusts inventory stock
2. System checks if quantity ≤ reorder_level
3. Checks if alert sent today (prevents spam)
4. Gets users with `lowStockAlerts` enabled
5. Sends notifications via enabled channels

### Order Updates
1. Order status changes (created/updated/completed)
2. Gets users with `orderUpdates` enabled
3. Includes order creator
4. Sends notifications via enabled channels

### Daily Digests
1. Cron job runs daily at configured time
2. Generates report for each tenant
3. Gets users with `reportDigests` enabled
4. Sends digest via email (primary channel)

## Notification Channels Priority

1. **Email** - Always available, requires SMTP
2. **SMS** - Requires Twilio account (costs money)
3. **Push** - Free, requires HTTPS and browser support

## Development Mode

- **SMS**: Logs messages instead of sending (unless `TWILIO_SEND_SMS=true`)
- **Email**: Works normally (requires SMTP config)
- **Push**: Works normally (requires HTTPS in production)

## Production Considerations

1. **HTTPS Required**: Push notifications require HTTPS
2. **VAPID Keys**: Generate once and store securely
3. **SMS Costs**: Monitor Twilio usage and costs
4. **Rate Limiting**: Already implemented in existing middleware
5. **Error Handling**: All notifications are non-blocking

## Troubleshooting

### Push Notifications Not Working
- Check browser console for errors
- Verify service worker is registered
- Check VAPID keys are set correctly
- Ensure HTTPS (required in production)

### SMS Not Sending
- Check Twilio credentials
- Verify `TWILIO_SEND_SMS=true` in production
- Check phone number format (E.164)

### Daily Digest Not Running
- Check cron schedule format
- Verify server is running at scheduled time
- Check logs for errors

## Future Enhancements

- [ ] Notification preferences per alert type
- [ ] Custom notification templates
- [ ] Notification history UI
- [ ] Batch notification sending
- [ ] Notification delivery status tracking
- [ ] Mobile app push notifications (FCM/APNS)

