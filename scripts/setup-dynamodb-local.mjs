import { CreateTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000";
const tableName = process.env.SESSIONS_TABLE_NAME ?? "conversational-ai-sessions";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "ap-southeast-1",
  endpoint,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

try {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    }),
  );
  console.log(`Created table ${tableName}`);
} catch (err) {
  if (err?.name === "ResourceInUseException") {
    console.log(`Table ${tableName} already exists`);
  } else {
    throw err;
  }
}
