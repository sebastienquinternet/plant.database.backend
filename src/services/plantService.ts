import { ddbDocClient } from './dynamoClient';
import { generatePlantDetails } from './aiPlantService';
import { fetchPexelsImages } from './pexelsService';
import { getPlantPKsByAliasPrefix, getPlantDetailsByPKs } from './searchPlantService';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { PlantTaxon, PlantCard } from '../models/plant';

const TABLE_NAME = process.env.PLANT_TABLE || 'PlantTaxon';

function slugifyName(name: string) {
  return name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');
}

export async function searchPlantByPrefix(prefix: string, logger: any): Promise<PlantCard[]> {
  logger.info('searchPlantByPrefix_start', { prefix });

  const pks = await getPlantPKsByAliasPrefix(prefix, logger);
  const cards = await getPlantDetailsByPKs(pks, logger);

  logger.info('searchPlantByPrefix_success', { prefix, count: cards.length });
  return cards;
}

export async function getPlantByPK(pkId: string, logger: any): Promise<PlantTaxon | null> {
  logger.info('getPlantByPK_start', { pkId });
  const pk = pkId.startsWith('PLANT#') ? pkId : `PLANT#${pkId}`;
  try {
    const res = await ddbDocClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk } } as any));
    const plant = (res.Item as PlantTaxon) ?? null;
    logger.info('getPlantByPK_dynamo_result', { pk, found: !!plant });

    if (!plant) {
      return null;
    }

    if (Array.isArray(plant.images) && plant.images.length > 0) {
      logger.info('getPlantByPK_images_present', { pk, imageCount: plant.images.length });
      return plant;
    }

    const images = await fetchPexelsImages(plant, logger);
    if (!images.length) {
      logger.warn('getPlantByPK_pexels_empty', { pk });
      return plant;
    }

    plant.images = images;
    plant.updatedAt = new Date().toISOString();
    await putPlant(plant, logger);
    logger.info('getPlantByPK_images_persisted', { pk, imageCount: images.length });
    return plant;
  } catch (err: any) {
    logger.error('getPlantByPK_error', { pk, error: err });
    throw err;
  }
}

export async function generatePlantDetailsByPK(pk: string, logger: any): Promise<PlantTaxon | null> {
  logger.info('generatePlantDetailsByPK_start', { pk });
  try {
    const plantDetails = await generatePlantDetails(pk, logger);
    logger.info('generatePlantDetailsByPK_success', { pk });
    return (plantDetails as PlantTaxon) ?? null;
  } catch (err: any) {
    logger.error('generatePlantDetailsByPK_error', { pk, error: err });
    throw err;
  }
}

export async function putPlant(body: Partial<PlantTaxon>, logger: any): Promise<PlantTaxon> {
  logger.info('putPlant_start', { body });
  const scientificName = body.scientificName || 'unnamed';
  const id = (body.PK && body.PK.replace(/^PLANT#/, '')) || slugifyName(scientificName);
  const pk = `PLANT#${id}`;
  const now = new Date().toISOString();
  const aliases = (body.aliases || []).map((a: string) => a.toLowerCase());

  const mainItem: any = {
    PK: pk,
    scientificName,
    commonName: body.commonName,
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
    humidity: body.humidity,
    popularity: body.popularity,
    soil: body.soil,
    lifeCycle: body.lifeCycle,
    leafRetention: body.leafRetention,
    rootType: body.rootType,
    repottingFrequency: body.repottingFrequency,
    feeding: body.feeding,
    toxicity: body.toxicity,
    origin: body.origin,
    nativeHeight: body.nativeHeight,
    leafSize: body.leafSize,
    growthRate: body.growthRate,
    maintenanceLevel: body.maintenanceLevel,
    airPurifying: body.airPurifying,
    petFriendly: body.petFriendly,
    frostTolerance: body.frostTolerance,
    heatTolerance: body.heatTolerance,
    images: body.images,
    createdAt: now,
    updatedAt: now
  };

  await ddbDocClient.send(new PutCommand({ TableName: TABLE_NAME, Item: mainItem } as any));
  logger.success('putPlant_success', { pk });
  return mainItem as PlantTaxon;
}

export async function updatePlant(body: Partial<PlantTaxon>, logger: any): Promise<PlantTaxon> {
  logger.info('updatePlant_start', { body });
  if (!body.PK) {
    logger.warn('updatePlant_missing_PK', { body });
    return {} as PlantTaxon;
  }
  await deletePlant(body.PK, logger);
  return putPlant(body, logger);
}

export async function deletePlant(pkId: string, logger: any): Promise<boolean> {
  const pk = pkId.startsWith('PLANT#') ? pkId : `PLANT#${pkId}`;
  logger.info('deletePlant_start', { pk });
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk },
      ConditionExpression: 'attribute_exists(PK)'
    } as any));
    logger.success('deletePlant_success', { pk });
    return true;
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      logger.warn('deletePlant_not_found', { pk });
      return false;
    }
    logger.error('deletePlant_error', { pk, error: err });
    throw err;
  }
}
