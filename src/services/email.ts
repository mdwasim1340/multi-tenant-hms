import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export const sendEmail = async (to: string, subject: string, body: string) => {
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: subject,
      },
    },
    Source: process.env.EMAIL_SENDER,
  });

  return sesClient.send(command);
};
