import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import * as dotenv from "dotenv";

dotenv.config();

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export const sendEmail = async (from: string, to: string, subject: string, body: string) => {
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
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    console.log("Email sent successfully:", response.MessageId);
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};
