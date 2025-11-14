import { ddbDocClient } from './dynamoClient';
import { generatePlantDetails } from './aiPlantService';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { PlantTaxon, PlantCard } from '../models/plant';
import { createLogger } from './loggerService';
import aliases from '../data/aliases.json';
import details from '../data/details.json';
const logger = createLogger({ service: 'plant.database.backend', ddsource:'plant.database', environment: 'dev' });

const TABLE_NAME = process.env.PLANT_TABLE || 'PlantTaxon';

function slugifyName(name: string) {
  return name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');
}

export async function getPlantPKsByAliasPrefix(prefix: string): Promise<string[]> {
  const lower = prefix.toLowerCase();
  const matches = new Set<string>();
  for (const [alias, pks] of Object.entries(aliases as Record<string, string[]>)) {
    if (!alias.toLowerCase().startsWith(lower)) {
      continue;
    }
    for (const shortPk of pks) {
      matches.add(`PLANT#${shortPk}`);
    }
  }
  return Array.from(matches);
}

export async function searchPlantByPrefix(prefix: string): Promise<PlantCard[]> {
  const pks = await getPlantPKsByAliasPrefix(prefix);

  const cardsObj: Record<string, PlantCard> = {};
  for (const pk of pks) {
    const shortPk = pk.replace(/^PLANT#/, '');
    const det = (details as Record<string, any> | undefined)?.[shortPk];
    cardsObj[shortPk] = det;
  }
  return Object.values(cardsObj);
}

export async function getPlantByPK(pk: string): Promise<PlantTaxon | null> {
  try {
    const res = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any));
    return (res.Item as PlantTaxon) ?? null;
  } catch (err: any) {
    logger.error(`getPlantByPK exception: ${err.message}`, err);
    throw err;
  }
}

export async function generatePlantDetailsByPK(pk: string): Promise<PlantTaxon | null> {
  try {
    const plantDetails = await generatePlantDetails(pk);
    return (plantDetails as PlantTaxon) ?? null;
  } catch (err: any) {
    logger.error(`generatePlantDetailsByPK exception: ${err.message}`, err);
    throw err;
  }
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

  await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: mainItem } as any));
  return mainItem as PlantTaxon;
}

export async function updatePlant(body: Partial<PlantTaxon>): Promise<PlantTaxon> {
  if (!body.PK) return {} as PlantTaxon;
  deletePlant(body.PK);
  return putPlant(body);
}

export async function deletePlant(pkId: string): Promise<boolean> {
  const pk = pkId.startsWith('PLANT#') ? pkId : `PLANT#${pkId}`;
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk },
      ConditionExpression: 'attribute_exists(PK)'
    } as any));
    return true;
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') return false;
    logger.error(`deletePlant exception: ${err.message}`, err);
    throw err;
  }
}
