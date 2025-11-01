import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const sendSms = async (phoneNumber: string, message: string) => {
  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
  });

  return snsClient.send(command);
};

export const sendNotification = async (topicArn: string, message: string) => {
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: message,
  });

  return snsClient.send(command);
};
