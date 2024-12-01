import { DynamoDB } from 'aws-cdk-lib';
import { SNS } from 'aws-cdk-lib';

const db = new DynamoDB.DocumentClient();
const sns = new SNS();
const tableName = process.env.TABLE_NAME!;
const snsTopicArn = process.env.SNS_TOPIC_ARN!;

export const handler = async (event: any) => {
  const itemCount = event.Records.length; 
  if (itemCount >= 10) {
    console.log('Threshold reached. Sending notification.');
    await sns
      .publish({
        TopicArn: snsTopicArn,
        Message: `Threshold reached: ${itemCount} items in the inventory.`,
      })
      .promise();
  }
};
