import details from '../data/details.json';
import { aliasShardMap, DEFAULT_ALIAS_SHARD_KEY } from '../data/aliasShardMap';
import { PlantCard } from '../models/plant';

function resolveAliasShardKey(value: string): string {
  if (!value || !value.trim()) {
    return DEFAULT_ALIAS_SHARD_KEY;
  }
  const firstChar = value.trim().charAt(0).toLowerCase();
  return /^[a-z]$/.test(firstChar) ? firstChar : DEFAULT_ALIAS_SHARD_KEY;
}

function getAliasShard(prefix: string): Record<string, string[]> {
  const shardKey = resolveAliasShardKey(prefix);
  return aliasShardMap[shardKey] || aliasShardMap[DEFAULT_ALIAS_SHARD_KEY] || {};
}

export async function getPlantPKsByAliasPrefix(prefix: string, logger: any): Promise<string[]> {
  logger.info('getPlantPKsByAliasPrefix_start', { prefix });
  if (!prefix || !prefix.trim()) {
    logger.warn('getPlantPKsByAliasPrefix_empty_prefix');
    return [];
  }
  if (prefix.length < 3) {
    logger.warn('getPlantPKsByAliasPrefix_prefix_too_short');
    return [];
  }

  const lower = prefix.toLowerCase();
  const shard = getAliasShard(prefix);
  const matches = new Set<string>();

  for (const [alias, pks] of Object.entries(shard)) {
    if (!alias.startsWith(lower)) {
      continue;
    }
    for (const pk of pks) {
      matches.add(pk);
    }
  }

  const result = Array.from(matches);
  logger.info('getPlantPKsByAliasPrefix_success', { prefix, count: result.length });
  return result;
}

export async function getPlantDetailsByPKs(pks: Array<string>, logger: any): Promise<PlantCard[]> {
  const cards = pks
    .map((pk) => details[pk])
    .filter((card): card is PlantCard & { popularity?: any } => Boolean(card));

  cards.sort((a, b) => b.popularity - a.popularity);
  // return cards;
  const topPlants = cards.slice(0, 50);
  return topPlants;
}
