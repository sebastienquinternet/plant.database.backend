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
