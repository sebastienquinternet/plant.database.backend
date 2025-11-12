import { ddbDocClient } from './dynamoClient';
import { QueryCommand, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { PlantTaxon } from '../models/plant';

const TABLE_NAME = process.env.PLANT_TABLE || 'PlantTaxon';
const ALIAS_INDEX = process.env.ALIAS_INDEX || 'AliasIndex';

export async function searchPlantByPrefix(prefix: string): Promise<PlantTaxon[]> {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: ALIAS_INDEX,
      KeyConditionExpression: 'begins_with(#alias, :prefix)',
      ExpressionAttributeNames: { '#alias': 'alias' },
      ExpressionAttributeValues: { ':prefix': prefix.toLowerCase() }
    })
  );

  const plantPKs = [...new Set((result.Items || []).map((i: any) => i.PK))];

  const plants = await Promise.all(
    plantPKs.map(async (pk) => {
      const getRes = await ddbDocClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as GetCommandInput)
      );
      return getRes.Item as PlantTaxon | undefined;
    })
  );

  return plants.filter(Boolean) as PlantTaxon[];
}

export async function getPlantByPK(pk: string): Promise<PlantTaxon | null> {
  const res = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } }));
  return (res.Item as PlantTaxon) ?? null;
}
