import { DynamoDB } from 'aws-cdk-lib';

const db = new DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME!;

export const handler = async () => {
  const result = await db.scan({ TableName: tableName, Select: 'COUNT' }).promise();
  console.log('Item count:', result.Count);
  return result.Count;
};
