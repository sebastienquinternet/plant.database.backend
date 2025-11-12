import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// DynamoDB client - configuration is taken from environment (AWS_* env vars, shared credentials, or IAM role)
const client = new DynamoDBClient({});

export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

export default ddbDocClient;
