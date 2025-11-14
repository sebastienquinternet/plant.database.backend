import { PlantTaxon } from '../models/plant';
import { createLogger } from './loggerService';
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const logger = createLogger({ service: 'ai.plant.generator', ddsource: 'plant.ai', environment: process.env.NODE_ENV || 'dev' });

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || process.env.AWS_BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';

const client = new BedrockRuntimeClient({ region: AWS_REGION });

const responseStructure = {
  scientificName: '<scientific name>',
  kingdom: '<kingdom>',
  phylum: '<phylum>',
  class: '<class>',
  order: '<order>',
  family: '<family>',
  genus: '<genus>',
  species: '<species>',
  aliases: ['<common names>'],
  watering: { value: '1-10', confidence: '0-1' },
  light: { value: '1-10', confidence: '0-1' },
  soil: { value: '<soil>', confidence: '0-1'},
  humidity: { value: '1-10', confidence: '0-1' },
  temperature: { value: '°C range', confidence: '0-1' },
  attributes: { toxicity: '<toxicity>', origin: '<origin>' }
};

export async function generatePlantDetails(plant: string): Promise<PlantTaxon> {
  const prompt = `# Plant Care Information Generator

## Task
Generate a comprehensive JSON object containing detailed care information and taxonomic classification for the specified plant.

## Instructions
1. Analyze the plant name provided
2. Research its scientific classification, common names, and care requirements
3. Use full names for scientific classification
4. Compile all information into a structured JSON object following the exact schema below
5. soil.value should be one of: "sandy","loamy","saline","peaty","clay","silt","chalky"
6. Assign confidence scores based on the reliability of your information

## JSON Schema
${JSON.stringify(responseStructure)}

## Important Rules
- Return ONLY the JSON object without any explanation, preamble, or additional text
- For numeric fields (watering, light, humidity): use a scale of 1-10 where 1 is lowest and 10 is highest
- For confidence scores: use a scale of 0-1 where 0 is no confidence and 1 is complete confidence
- If uncertain about any value, provide your best estimate but assign a lower confidence score
- Ensure all required fields are populated, even with best estimates when exact information is unavailable

Plant: ${plant}`;


  logger.info(`Generate plant details using ${BEDROCK_MODEL_ID}: ${plant}`, { prompt });
  const message = {
    content: [{ text: prompt }],
    role: ConversationRole.USER,
  };
  const request = {
    modelId: BEDROCK_MODEL_ID,
    messages: [message],
    inferenceConfig: {
      maxTokens: 1000
    },
  };
  try {
    const command = new ConverseCommand(request);
    const response = await client.send(command);
    const text = response.output?.message?.content?.[0]?.text ?? "";
    return JSON.parse(text) as PlantTaxon;
  } catch (err: any) {
    logger.error(`generatePlantDetails exception: ${err.message}`, err);
    throw err;
  }
}
