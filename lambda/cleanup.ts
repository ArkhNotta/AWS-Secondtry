import { DynamoDB } from 'aws-cdk-lib

const db = new DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME!;

export const handler = async () => {
  // Query the 10 most recent items
  const result = await db
    .scan({
      TableName: tableName,
      Limit: 10,
      ScanIndexForward: false, 
    })
    .promise();

  const itemsToDelete = result.Items || [];
  const deletePromises = itemsToDelete.map((item) =>
    db
      .delete({
        TableName: tableName,
        Key: {
          productId: item.productId,
          createdAt: item.createdAt,
        },
      })
      .promise()
  );

  await Promise.all(deletePromises);
  console.log(`Deleted ${deletePromises.length} most recent items`);
};
