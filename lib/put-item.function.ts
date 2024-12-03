import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { type EventBridgeEvent } from "aws-lambda";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export const handler = async (event: EventBridgeEvent<any, any>): Promise<void> => {
  console.log("Processing EventBrideEvent:", JSON.stringify(event, null, 2));

  const now = new Date();
  const ttl = Math.floor(now.getTime() / 1000);

  await ddbClient.send(
    new PutItemCommand({
      TableName: process.env.TABLE,
      Item: {
        pk: { S: now.toISOString() },
        sk: { S: now.toISOString() },
        ttl: { N: ttl.toString() },
      },
    }),
  );
};
