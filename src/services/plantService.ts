import { ddbDocClient } from './dynamoClient';
import { QueryCommand, GetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { PlantTaxon } from '../models/plant';
import { createLogger } from './loggerService';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

const TABLE_NAME = process.env.PLANT_TABLE || 'PlantTaxon';
const ALIAS_INDEX = process.env.ALIAS_INDEX || 'AliasIndex';

// GSI partition key attribute name and expected constant value used to store alias rows.
// Example: each alias item can have { GSI1PK: 'ALIAS', alias: 'monstera', PK: 'PLANT#monstera_deliciosa' }
const ALIAS_GSI_PARTITION_NAME = process.env.ALIAS_GSI_PARTITION_NAME || 'GSI1PK';
const ALIAS_GSI_PARTITION_VALUE = process.env.ALIAS_GSI_PARTITION_VALUE || 'ALIAS';
const ALIAS_ATTRIBUTE_NAME = process.env.ALIAS_ATTRIBUTE_NAME || 'alias';

export async function getPlantPKsByAliasPrefix(prefix: string): Promise<string[]> {
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
  // alias items store a reference to the target plant PK in `targetPK`
  return [...new Set((result.Items || []).map((i: any) => i.targetPK || i.PK))];
}

export async function getPlantsByPKs(pks: string[]): Promise<PlantTaxon[]> {
  const plants = await Promise.all(
    pks.map(async (pk) => {
      const getRes = await ddbDocClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any)
      );
      return getRes.Item as PlantTaxon | undefined;
    })
  );
  return plants.filter(Boolean) as PlantTaxon[];
}

export async function searchPlantByPrefix(prefix: string): Promise<PlantTaxon[]> {
  try {
    const pks = await getPlantPKsByAliasPrefix(prefix);
    if (pks.length === 0) return [];
    return getPlantsByPKs(pks);
  } catch (err: any) {
    logger.error(`searchPlantByPrefix exception: ${err.message}`);
    throw err;
  }
}

export async function getPlantByPK(pk: string): Promise<PlantTaxon | null> {
  try {
    const res = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any));
    return (res.Item as PlantTaxon) ?? null;
  } catch (err: any) {
    logger.error(`searchPlantByPrefix exception: ${err.message}`);
    throw err;
  }
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function putPlant(body: Partial<PlantTaxon>): Promise<PlantTaxon> {
  const scientificName = body.scientificName || 'unnamed';
  const id = (body.PK && body.PK.replace(/^PLANT#/, '')) || slugifyName(scientificName);
  const pk = `PLANT#${id}`;
  const now = new Date().toISOString();
  const aliases = (body.aliases || []).map((a: string) => a.toLowerCase());

  const mainItem: any = {
    PK: pk,
    scientificName,
    kingdom: body.kingdom,
    phylum: body.phylum,
    class: body.class,
    order: body.order,
    family: body.family,
    genus: body.genus,
    species: body.species,
    aliases,
    watering: body.watering,
    light: body.light,
    soil: body.soil,
    humidity: body.humidity,
    temperature: body.temperature,
    attributes: body.attributes,
    createdAt: now,
    updatedAt: now
  };

  // prepare batch write: main item + alias items
  const writeRequests: any[] = [];
  writeRequests.push({ PutRequest: { Item: mainItem } });

  for (const alias of aliases) {
    const aliasSlug = slugifyName(alias);
    const aliasPk = `ALIAS#${id}#${aliasSlug}`;
    const aliasItem = {
      PK: aliasPk,
      GSI1PK: ALIAS_GSI_PARTITION_VALUE,
      alias: alias.toLowerCase(),
      targetPK: pk,
      createdAt: now
    };
    writeRequests.push({ PutRequest: { Item: aliasItem } });
  }

  // BatchWrite supports up to 25 items per request; aliases will typically be small
  await ddbDocClient.send(new BatchWriteCommand({ RequestItems: { [TABLE_NAME]: writeRequests } }));

  return mainItem as PlantTaxon;
}

export async function updatePlant(pkId: string, updates: Partial<PlantTaxon>): Promise<PlantTaxon | null> {
  const pk = pkId.startsWith('PLANT#') ? pkId : `PLANT#${pkId}`;
  const existing = await getPlantByPK(pk);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...updates,
    aliases: (updates.aliases || existing.aliases || []).map((a: string) => a.toLowerCase()),
    // preserve existing nested metrics unless updated
    watering: updates.watering ?? existing.watering,
    light: updates.light ?? existing.light,
    soil: updates.soil ?? existing.soil,
    humidity: updates.humidity ?? existing.humidity,
    temperature: updates.temperature ?? existing.temperature,
    updatedAt: new Date().toISOString()
  } as PlantTaxon;

  // delete old alias items then recreate new alias items
  const oldAliases = existing.aliases || [];
  const deleteRequests: any[] = [];
  for (const alias of oldAliases) {
    const aliasSlug = slugifyName(alias);
    const aliasPk = `ALIAS#${pk.replace(/^PLANT#/, '')}#${aliasSlug}`;
    deleteRequests.push({ DeleteRequest: { Key: { PK: aliasPk } } });
  }

  const putRequests: any[] = [];
  // main item put
  putRequests.push({ PutRequest: { Item: merged } });
  for (const alias of merged.aliases || []) {
    const aliasSlug = slugifyName(alias);
    const aliasPk = `ALIAS#${pk.replace(/^PLANT#/, '')}#${aliasSlug}`;
    const aliasItem = {
      PK: aliasPk,
      GSI1PK: ALIAS_GSI_PARTITION_VALUE,
      alias: alias.toLowerCase(),
      targetPK: pk,
      createdAt: existing.createdAt || new Date().toISOString()
    };
    putRequests.push({ PutRequest: { Item: aliasItem } });
  }

  const requests = [...deleteRequests, ...putRequests];
  if (requests.length > 0) {
    await ddbDocClient.send(new BatchWriteCommand({ RequestItems: { [TABLE_NAME]: requests } }));
  }

  return merged;
}

export async function deletePlant(pkId: string): Promise<boolean> {
  const pk = pkId.startsWith('PLANT#') ? pkId : `PLANT#${pkId}`;
  const existing = await getPlantByPK(pk);
  if (!existing) return false;

  const deleteRequests: any[] = [];
  // delete alias items
  for (const alias of existing.aliases || []) {
    const aliasSlug = slugifyName(alias);
    const aliasPk = `ALIAS#${pk.replace(/^PLANT#/, '')}#${aliasSlug}`;
    deleteRequests.push({ DeleteRequest: { Key: { PK: aliasPk } } });
  }
  // delete main item
  deleteRequests.push({ DeleteRequest: { Key: { PK: pk } } });

  if (deleteRequests.length > 0) {
    await ddbDocClient.send(new BatchWriteCommand({ RequestItems: { [TABLE_NAME]: deleteRequests } }));
  }

  return true;
}
