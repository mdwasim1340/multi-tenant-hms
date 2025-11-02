import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import * as dotenv from "dotenv";

dotenv.config();

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export const sendEmail = async (from: string, to: string, subject: string, body: string) => {
  console.log(`📧 Attempting to send email from ${from} to ${to}`);
  
  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body,
        },
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject}</h2>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
                ${body.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This email was sent from your multi-tenant authentication system.
              </p>
            </div>
          `,
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    console.log(`✅ Email sent successfully! Message ID: ${response.MessageId}`);
    console.log(`📬 From: ${from} → To: ${to}`);
    return response;
  } catch (error: any) {
    console.error(`❌ Failed to send email from ${from} to ${to}:`);
    console.error(`   Error: ${error.message}`);
    
    // Provide helpful error messages
    if (error.name === 'MessageRejected') {
      console.error('🔧 Possible fixes:');
      console.error('   - Verify the FROM email address in AWS SES Console');
      console.error('   - Check if your account is in SES sandbox mode');
      console.error('   - Ensure the TO address is verified (if in sandbox)');
    } else if (error.name === 'AccessDenied') {
      console.error('🔧 Fix: Add SES permissions to your IAM user/role');
    } else if (error.name === 'Throttling') {
      console.error('🔧 Fix: Reduce email sending rate or request higher limits');
    }
    
    throw error;
  }
};
