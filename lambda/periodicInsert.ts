import { DynamoDB } from 'aws-cdk-lib';
import { v4 as uuidv4 } from 'uuid';

const db = new DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME!;

export const handler = async () => {
  const newItem = {
    productId: uuidv4(),
    shortDescription: 'Sample Item',
    tag: 'clothes',
    cost: Math.random() * 100,
    createdAt: new Date().toISOString(),
  };
  await db.put({ TableName: tableName, Item: newItem }).promise();
  console.log('Inserted item:', newItem);
};
