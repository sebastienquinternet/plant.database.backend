# plant.database.backend

TypeScript AWS Lambda backend for plant data.

Quick start

1. Install dependencies

```bash
npm install
```

2. Build

```bash
npm run build
```

3. Run the compiled handler locally (example)

```bash
npm start
```

Deploy

- Example `template.yaml` provided for AWS SAM. Build with `npm run build` first.
- Create a GitHub repository named `plant.database.backend` and follow these steps to push:

```bash
git remote add origin git@github.com:YOUR_USER/plant.database.backend.git
git branch -M main
git push -u origin main
```

Next steps

- Hook up a data source (DynamoDB/RDS) and replace static sample data.
- Add tests, linting, and CI workflows.

Environment variables

- `PLANT_TABLE` - DynamoDB table name (defaults to `PlantTaxon` in code)
- `ALIAS_INDEX` - Name of the GSI used for alias lookups (defaults to `AliasIndex`)
- `ALIAS_GSI_PARTITION_NAME` - Attribute name used as the GSI partition (defaults to `GSI1PK`)
- `ALIAS_GSI_PARTITION_VALUE` - Partition value used for alias rows (defaults to `ALIAS`)
- `ALIAS_ATTRIBUTE_NAME` - Attribute name that stores the alias string (defaults to `alias`)

GSI / alias design notes

- Each plant will have an item representing the plant (PK = `PLANT#<slug>`). The item includes an `aliases: string[]` attribute.
- To allow efficient prefix searches on aliases, add additional alias rows (one per alias) that duplicate the plant `PK` and include the alias as a top-level string attribute. Example rows:

```
PK                         | GSI1PK | alias
PLANT#monstera_deliciosa   | ALIAS  | monstera
PLANT#monstera_deliciosa   | ALIAS  | cheese plant
PLANT#monstera_deliciosa   | ALIAS  | deliciosa
```

- Create a GSI (e.g. `AliasIndex`) that uses `GSI1PK` as the partition key and `alias` as the sort key. This lets us run a Query with `GSI1PK = 'ALIAS' AND begins_with(alias, :prefix)` to return alias rows matching the prefix.
- Store lowercase aliases for case-insensitive searches; the service converts the query to lowercase before querying.

Notes

- The repo contains a small DynamoDB client and service at `src/services/` and a sample handler that uses them. Infrastructure (table + GSI) can live in a separate repo; just ensure env vars match.
