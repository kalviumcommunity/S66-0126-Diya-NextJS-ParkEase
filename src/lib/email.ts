/**
 * Email Service Utility
 * Supports multiple email providers: SendGrid, AWS SES, and console fallback
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using configured service or fallback to console
 *
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @param options - Optional: from, replyTo
 * @returns Promise with send result
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { from?: string; replyTo?: string }
): Promise<SendEmailResult> {
  const emailService = process.env.EMAIL_SERVICE || 'console';
  const senderEmail = options?.from || process.env.SENDER_EMAIL || 'noreply@parkease.com';

  const emailOptions: EmailOptions = {
    to,
    subject,
    html,
    from: senderEmail,
    replyTo: options?.replyTo,
  };

  try {
    switch (emailService.toLowerCase()) {
      case 'sendgrid':
        return await sendViaSendGrid(emailOptions);
      case 'aws-ses':
      case 'ses':
        return await sendViaSES(emailOptions);
      case 'console':
      default:
        return logEmailToConsole(emailOptions);
    }
  } catch (error) {
    console.error(`Error sending email via ${emailService}:`, error);
    // Fallback to console logging if service fails
    return logEmailToConsole(emailOptions);
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options: EmailOptions): Promise<SendEmailResult> {
  try {
    let sgMailClient: any;
    try {
      // @ts-expect-error - optional dependency
      const sgMail = await import('@sendgrid/mail');
      sgMailClient = sgMail.default;
    } catch {
      // SendGrid not installed, fall through to console logging
      throw new Error('SendGrid module not available');
    }

    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable not set');
    }

    sgMailClient.setApiKey(process.env.SENDGRID_API_KEY);

    const [response] = await sgMailClient.send({
      to: options.to,
      from: options.from || 'noreply@parkease.com',
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    console.log(`✉️ Email sent via SendGrid to ${options.to}`);

    return {
      success: true,
      messageId: response.headers['x-message-id'],
    };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
}

/**
 * Send email via AWS SES
 */
async function sendViaSES(options: EmailOptions): Promise<SendEmailResult> {
  try {
    // @ts-expect-error - optional dependency
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }

    const sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new SendEmailCommand({
      Source: options.from || 'noreply@parkease.com',
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: 'UTF-8',
          },
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
    });

    const response = await sesClient.send(command);

    console.log(`✉️ Email sent via AWS SES to ${options.to}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error('AWS SES error:', error);
    throw error;
  }
}

/**
 * Log email to console (development mode)
 */
function logEmailToConsole(options: EmailOptions): SendEmailResult {
  console.log('📧 [EMAIL - DEVELOPMENT MODE]');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`From: ${options.from}`);
  if (options.replyTo) {
    console.log(`Reply-To: ${options.replyTo}`);
  }
  console.log('---');
  console.log(options.html);
  console.log('---\n');

  return {
    success: true,
    messageId: `dev-${Date.now()}`,
  };
}

/**
 * Generate Welcome Email HTML
 */
export function getWelcomeEmailHtml(userName: string, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          h1 { margin: 0; font-size: 28px; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ParkEase! 🚗</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for joining ParkEase! We're excited to have you on board.</p>
            <p>With ParkEase, you can:</p>
            <ul>
              <li>Find and book available parking spots easily</li>
              <li>Manage your bookings in real-time</li>
              <li>Get notifications about your reservations</li>
              <li>Build a parking history</li>
            </ul>
            <p>Your account is ready to use. Log in with your email and start finding parking spots today!</p>
            <p><strong>Account Email:</strong> ${userEmail}</p>
            <div class="footer">
              <p>© 2026 ParkEase. All rights reserved.</p>
              <p>If you didn't create this account, please contact us immediately.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate Booking Confirmation Email HTML
 */
export function getBookingConfirmationEmailHtml(
  userName: string,
  bookingDetails: {
    bookingId: string;
    slotLocation: string;
    row: number;
    column: number;
    startTime: string;
    endTime: string;
  }
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 4px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #333; font-size: 18px; margin-top: 0; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed! ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Great news! Your parking spot has been successfully booked. Here are your booking details:</p>
            
            <div class="booking-details">
              <h2>Booking Details</h2>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span class="value">${bookingDetails.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${bookingDetails.slotLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Slot Position:</span>
                <span class="value">Row ${bookingDetails.row}, Column ${bookingDetails.column}</span>
              </div>
              <div class="detail-row">
                <span class="label">Start Time:</span>
                <span class="value">${new Date(bookingDetails.startTime).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">End Time:</span>
                <span class="value">${new Date(bookingDetails.endTime).toLocaleString()}</span>
              </div>
            </div>

            <p>Please save this confirmation. You'll need the booking ID if you need to make any changes.</p>
            <p><strong>Important:</strong> Arrive a few minutes early to ensure a smooth check-in process.</p>
            
            <div class="footer">
              <p>© 2026 ParkEase. All rights reserved.</p>
              <p>Questions? Contact our support team at support@parkease.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default {
  sendEmail,
  getWelcomeEmailHtml,
  getBookingConfirmationEmailHtml,
};
