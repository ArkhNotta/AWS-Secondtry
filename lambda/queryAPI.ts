import { aws_dynamodb } from 'aws-cdk-lib';

const db = new aws_dynamodb.DocumentClient();
const tableName = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  const { productId } = JSON.parse(event.body);
  const result = await db
    .get({ TableName: tableName, Key: { productId } })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ item: result.Item }),
  };
};
