import { ddbDocClient } from './dynamoClient';
import { QueryCommand, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { PlantTaxon } from '../models/plant';

const TABLE_NAME = process.env.PLANT_TABLE || 'PlantTaxon';
const ALIAS_INDEX = process.env.ALIAS_INDEX || 'AliasIndex';

// GSI partition key attribute name and expected constant value used to store alias rows.
// Example: each alias item can have { GSI1PK: 'ALIAS', alias: 'monstera', PK: 'PLANT#monstera_deliciosa' }
const ALIAS_GSI_PARTITION_NAME = process.env.ALIAS_GSI_PARTITION_NAME || 'GSI1PK';
const ALIAS_GSI_PARTITION_VALUE = process.env.ALIAS_GSI_PARTITION_VALUE || 'ALIAS';
const ALIAS_ATTRIBUTE_NAME = process.env.ALIAS_ATTRIBUTE_NAME || 'alias';

export async function searchPlantByPrefix(prefix: string): Promise<PlantTaxon[]> {
  // Query the alias GSI where the GSI partition equals a constant (e.g. 'ALIAS')
  // and the sort key (alias) begins with the provided prefix (lowercased).
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: ALIAS_INDEX,
      KeyConditionExpression: `#gsiPk = :gsiPkVal AND begins_with(#alias, :prefix)`,
      ExpressionAttributeNames: {
        '#gsiPk': ALIAS_GSI_PARTITION_NAME,
        '#alias': ALIAS_ATTRIBUTE_NAME
      },
      ExpressionAttributeValues: {
        ':gsiPkVal': ALIAS_GSI_PARTITION_VALUE,
        ':prefix': prefix.toLowerCase()
      }
    })
  );

  const plantPKs = [...new Set((result.Items || []).map((i: any) => i.PK))];

  const plants = await Promise.all(
    plantPKs.map(async (pk) => {
      const getRes = await ddbDocClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any)
      );
      return getRes.Item as PlantTaxon | undefined;
    })
  );

  return plants.filter(Boolean) as PlantTaxon[];
}

export async function getPlantByPK(pk: string): Promise<PlantTaxon | null> {
  const res = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any));
  return (res.Item as PlantTaxon) ?? null;
}
