import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@mail.bamgoodtime.com';

// BAM Good Time brand colors
const COLORS = {
  greenDeep: '#4a8f53',
  coral: '#fd5d9d',
  cream: '#fdfaf6',
  text: '#3a5245',
  textLight: '#6d8a79',
};

/**
 * Send a welcome/invoice email after verification payment.
 */
export async function sendVerificationWelcomeEmail({
  to,
  customerName,
  transactionId,
  transactionDate,
  expiresDate,
}: {
  to: string;
  customerName: string;
  transactionId: string;
  transactionDate: Date;
  expiresDate: Date;
}) {
  const formattedDate = transactionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedExpires = expiresDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Mahjic</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.cream};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${COLORS.greenDeep}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px; font-family: 'Playfair Display', Georgia, serif;">MAHJIC</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Open Rating System for American Mahjong</p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: ${COLORS.greenDeep}; font-size: 24px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Welcome to Mahjic!</h2>
              <p style="margin: 0; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;">
                Thank you for becoming a verified player. Your payment has been received and processed successfully.
              </p>
            </td>
          </tr>

          <!-- Invoice Box -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table role="presentation" style="width: 100%; border: 1px solid #e5e5e5; border-radius: 6px; border-collapse: collapse;">

                <!-- Invoice Header -->
                <tr>
                  <td colspan="2" style="padding: 20px 24px; background-color: ${COLORS.cream}; border-bottom: 1px solid #e5e5e5;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="text-align: left;">
                          <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Invoice</p>
                          <p style="margin: 4px 0 0 0; color: ${COLORS.text}; font-size: 14px; font-weight: 500;">${transactionId}</p>
                        </td>
                        <td style="text-align: right;">
                          <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</p>
                          <p style="margin: 4px 0 0 0; color: ${COLORS.text}; font-size: 14px; font-weight: 500;">${formattedDate}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Info -->
                <tr>
                  <td colspan="2" style="padding: 16px 24px; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Billed To</p>
                    <p style="margin: 4px 0 0 0; color: ${COLORS.text}; font-size: 14px;">${customerName}</p>
                    <p style="margin: 2px 0 0 0; color: ${COLORS.textLight}; font-size: 14px;">${to}</p>
                  </td>
                </tr>

                <!-- Line Item -->
                <tr>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; font-weight: 500;">Player Verification - Annual Subscription</p>
                    <p style="margin: 4px 0 0 0; color: ${COLORS.textLight}; font-size: 13px;">Valid through ${formattedExpires}</p>
                  </td>
                  <td style="padding: 16px 24px; border-bottom: 1px solid #e5e5e5; text-align: right; vertical-align: top;">
                    <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; font-weight: 500;">$20.00</p>
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td style="padding: 16px 24px;">
                    <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; font-weight: 600;">Total</p>
                  </td>
                  <td style="padding: 16px 24px; text-align: right;">
                    <p style="margin: 0; color: ${COLORS.coral}; font-size: 18px; font-weight: 700;">$20.00 USD</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background-color: ${COLORS.cream}; border-radius: 6px; padding: 20px 24px;">
                <h3 style="margin: 0 0 12px 0; color: ${COLORS.greenDeep}; font-size: 16px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Next Step: Complete Identity Verification</h3>
                <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.6;">
                  To appear on the verified leaderboard, please complete your identity verification.
                  Log in to your account at <a href="https://mahjic.org" style="color: ${COLORS.coral}; text-decoration: none; font-weight: 500;">mahjic.org</a>
                  and follow the prompts to verify your identity with Stripe.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.cream}; border-top: 1px solid #e5e5e5;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: ${COLORS.textLight}; font-size: 13px;">
                      Questions? Contact us at <a href="mailto:support@mahjic.org" style="color: ${COLORS.coral}; text-decoration: none;">support@mahjic.org</a>
                    </p>
                    <p style="margin: 12px 0 0 0; color: ${COLORS.textLight}; font-size: 12px;">
                      Mahjic - Open Rating System for American Mahjong<br>
                      A Bam Good Time product
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const { data, error } = await resend.emails.send({
    from: `Mahjic by Bam Good Time <${FROM_EMAIL}>`,
    to: [to],
    subject: 'Welcome to Mahjic - Payment Confirmation',
    html,
  });

  if (error) {
    console.error('Failed to send verification welcome email:', error);
    throw error;
  }

  console.log(`Verification welcome email sent to ${to}, id: ${data?.id}`);
  return data;
}
