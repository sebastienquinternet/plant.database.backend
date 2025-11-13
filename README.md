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

Post-deploy: create API Key & Usage Plan

- A helper script is included at `scripts/create-api-key.sh` which creates (or reuses) an API Key and a Usage Plan and attaches the key to the deployed API stage.
- Basic usage (after a successful `sam deploy`):

```bash
# create a key (AWS generates the value)
./scripts/create-api-key.sh

# create a key with a specific value
./scripts/create-api-key.sh --key 'my-secret-key'

# override region or api name if needed
./scripts/create-api-key.sh --region eu-west-1 --api-name PlantDatabaseApi --stage prod
```

Region selection (how the script decides which AWS region to use)

- The script sets the region from the environment variable `AWS_REGION` if it is present; otherwise it falls back to `us-east-1`.
- Important detail: the script always passes `--region` to every `aws` CLI call using the chosen region value. That means it will NOT fall back to the AWS CLI config file (`~/.aws/config`) or `AWS_DEFAULT_REGION` — it uses the explicit `AWS_REGION` env var if set, otherwise `us-east-1`.

If you prefer the script to honor your AWS CLI configuration (profile/region) when no env var is set, change the line near the top of the script from:

```bash
REGION="${AWS_REGION:-us-east-1}"
```

to something that prefers `AWS_DEFAULT_REGION` and then the CLI config, for example:

```bash
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}
if [[ -z "$REGION" ]]; then
	# try to read default region from aws config using the default profile
	REGION=$(aws configure get region || true)
fi
REGION=${REGION:-us-east-1}
```

This change will:
- Use `AWS_REGION` if set; else
- Use `AWS_DEFAULT_REGION` if set; else
- Try `aws configure get region` (reads from default profile in `~/.aws/config`) ; else
- Fall back to `us-east-1`.

Security note

- If you let AWS generate the API key value, the script prints it to stdout. Treat this value like a secret and rotate/store it securely (Secrets Manager, Parameter Store, or your secret vault).

