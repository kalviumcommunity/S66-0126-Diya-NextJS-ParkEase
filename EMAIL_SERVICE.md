# Email Service Configuration

This guide explains how to set up email sending in ParkEase using SendGrid, AWS SES, or development console logging.

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Service Configuration
EMAIL_SERVICE=console          # Options: console, sendgrid, aws-ses, ses
SENDER_EMAIL=noreply@parkease.com

# SendGrid Configuration (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# AWS SES Configuration (if using AWS SES)
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Development Mode (Default)

By default, `EMAIL_SERVICE=console` logs all emails to the console. This is perfect for development:

```
📧 [EMAIL - DEVELOPMENT MODE]
To: user@example.com
Subject: Welcome to ParkEase!
From: noreply@parkease.com
---
<!DOCTYPE html>
<html>
  <head>...
```

## SendGrid Setup

### 1. Create SendGrid Account

- Sign up at https://sendgrid.com
- Verify sender domain (for production)

### 2. Generate API Key

1. Go to Settings → API Keys
2. Create a new API Key with "Mail Send" permission
3. Copy the key and add to `.env.local`:

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install SendGrid Package

```bash
npm install @sendgrid/mail
```

### 4. Verify Sender Email

For production, verify your domain at SendGrid dashboard. For testing, any email works.

## AWS SES Setup

### 1. Configure AWS Account

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
```

### 2. Verify Sender Email

```bash
aws ses verify-email-identity --email-address noreply@parkease.com --region us-east-1
```

Check your email and click the verification link.

### 3. Exit Sandbox Mode (Optional)

By default, SES is in sandbox mode (can only send to verified addresses).

To send to any email:
1. Go to AWS SES Console
2. Request production access
3. Wait for approval (usually 24 hours)

### 4. Add to `.env.local`

```env
EMAIL_SERVICE=aws-ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 5. Note: AWS SDK Already Installed

The `@aws-sdk/client-ses` package is automatically imported when needed.

## Email Types

### 1. Welcome Email

**Trigger:** User signs up successfully

**Content:**
- Welcome message
- Account confirmation
- Getting started tips
- Account email address

**Template:** `getWelcomeEmailHtml()` in `src/lib/email.ts`

### 2. Booking Confirmation Email

**Trigger:** User creates a parking booking

**Content:**
- Confirmation message
- Booking ID
- Parking location (Row, Column)
- Slot address
- Start and end times
- Instructions

**Template:** `getBookingConfirmationEmailHtml()` in `src/lib/email.ts`

## Usage Examples

### Send Welcome Email

```typescript
import { sendEmail, getWelcomeEmailHtml } from '@/lib/email';

const html = getWelcomeEmailHtml(user.name, user.email);
await sendEmail(user.email, 'Welcome to ParkEase!', html);
```

### Send Booking Confirmation

```typescript
import { sendEmail, getBookingConfirmationEmailHtml } from '@/lib/email';

const html = getBookingConfirmationEmailHtml(user.name, {
  bookingId: booking.id,
  slotLocation: 'Downtown Parking Garage',
  row: slot.row,
  column: slot.column,
  startTime: booking.startTime.toISOString(),
  endTime: booking.endTime.toISOString(),
});

await sendEmail(user.email, 'Booking Confirmed', html);
```

### Custom Email

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail(
  'user@example.com',
  'Custom Subject',
  '<h1>Custom HTML Content</h1>',
  {
    from: 'support@parkease.com',
    replyTo: 'support@parkease.com'
  }
);
```

## API Reference

### `sendEmail(to, subject, html, options?)`

Send an email using configured service.

**Parameters:**
- `to` (string): Recipient email address
- `subject` (string): Email subject
- `html` (string): Email HTML content
- `options` (object, optional):
  - `from` (string): Sender email (default: SENDER_EMAIL env var)
  - `replyTo` (string): Reply-to address

**Returns:** Promise<SendEmailResult>

```typescript
{
  success: boolean;      // Whether email was sent successfully
  messageId?: string;    // Provider message ID (useful for tracking)
  error?: string;        // Error message if failed
}
```

### `getWelcomeEmailHtml(userName, userEmail)`

Generate HTML for welcome email.

**Returns:** HTML string with styled welcome message

### `getBookingConfirmationEmailHtml(userName, bookingDetails)`

Generate HTML for booking confirmation.

**Parameters:**
- `userName` (string): User's name
- `bookingDetails` (object):
  - `bookingId` (string): Unique booking ID
  - `slotLocation` (string): Parking location name
  - `row` (number): Slot row
  - `column` (number): Slot column
  - `startTime` (string): ISO datetime string
  - `endTime` (string): ISO datetime string

**Returns:** HTML string with styled booking details

## Endpoints Using Email

### POST /api/auth/signup
- Sends welcome email after successful registration
- Fallback: Console log if email service fails

### POST /api/bookings
- Sends booking confirmation after successful booking
- Fallback: Console log if email service fails

## Testing

### Development Mode

No setup needed. Emails print to console:

```bash
npm run dev
```

Create a user or booking and check the console output.

### SendGrid Test Mode

To test without consuming SendGrid credits, use the test API key in sandbox mode.

### AWS SES Test Mode

1. Create verified email addresses for testing
2. Use those addresses in test requests
3. Check email inbox for received emails

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variable:**
   ```bash
   echo $EMAIL_SERVICE
   # Should output: console, sendgrid, or aws-ses
   ```

2. **Check Credentials:**
   - SendGrid: Verify API key is valid and has "Mail Send" permission
   - AWS SES: Verify credentials with `aws sts get-caller-identity`

3. **Check Sender Email:**
   - Verify sender email is configured
   - AWS SES: Verify sender email is approved

4. **Check Server Logs:**
   - Look for email-related error messages
   - Check the console/logs for the email service response

### SendGrid Errors

**401 Unauthorized:**
- API key is invalid or has wrong permissions
- Check SENDGRID_API_KEY in .env.local

**403 Forbidden:**
- API key doesn't have "Mail Send" permission
- Generate new API key with correct permissions

### AWS SES Errors

**MessageRejected:**
- Sender email not verified
- Run: `aws ses verify-email-identity --email-address noreply@parkease.com`

**ServiceUnavailable:**
- AWS credentials invalid
- Run: `aws sts get-caller-identity` to verify

## Email Customization

### Modify Templates

Edit email templates in `src/lib/email.ts`:
- `getWelcomeEmailHtml()` for welcome emails
- `getBookingConfirmationEmailHtml()` for booking emails

### Add New Email Type

```typescript
export function getCustomEmailHtml(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* CSS here */
        </style>
      </head>
      <body>
        <!-- HTML here -->
      </body>
    </html>
  `;
}
```

Then use it:

```typescript
const html = getCustomEmailHtml(data);
await sendEmail(email, 'Subject', html);
```

## Production Best Practices

1. **Use SendGrid or AWS SES** in production, not console
2. **Set up SPF/DKIM/DMARC** records for domain verification
3. **Use branded sender email** (e.g., noreply@parkease.com)
4. **Monitor email delivery** via provider dashboard
5. **Set Reply-To header** for user inquiries
6. **Test email templates** thoroughly before deploying
7. **Handle email failures gracefully** - don't block user operations
8. **Rate limit email sending** to avoid quota issues
9. **Keep sensitive data out of email logs**
10. **Encrypt API keys** in secrets management system

## Costs

### SendGrid
- Free: 100 emails/day
- Pro: Starting at $29.95/month (unlimited emails)
- Email validation: Extra cost

### AWS SES
- $0.10 per 1,000 emails sent
- Inbox placement rate: $0.01 per 1,000 emails
- Free tier: 62,000 emails/month to verified addresses

### Cost Comparison
For a parking app with 1,000 bookings/month:
- SendGrid: $0 (free tier) → $29.95/month (pro)
- AWS SES: ~$0.10/month (very cheap)

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Email Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)
- [HTML Email Templates](https://stripo.email)
