import { PlantTaxon } from '../models/plant';
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || process.env.AWS_BEDROCK_MODEL_ID || 'amazon.nova-micro-v1:0';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';

const client = new BedrockRuntimeClient({ region: AWS_REGION });

const responseStructure = {
	scientificName: "<scientific name>",
	species: "<species>",
	aliases: ["<common names>"],
	watering: {value: 1-10, confidence: 0-1},
	light: {value: 1-10, confidence: 0-1},
	humidity: {value: 1-10, confidence: 0-1},
	temperature: {value: "°C range", confidence: 0-1},
  popularity: { value: 1-100, confidence: 0-1 },
	soil: {value: "<soil>", confidence: 0-1},
  attributes: {
    toxicity: "<toxicity>",
    origin: "<origin>",
    nativeHeight: "<nativeHeight>",
    leafSize: "leafSize",
    growthRate: "<growthRate>",
    maintenanceLevel: "<maintenanceLevel>",
    airPurifying: "<airPurifying>",
    petFriendly: "<petFriendly>"
  },
}

export async function generatePlantDetails(plant: string, logger: any): Promise<PlantTaxon> {
  logger.info('generatePlantDetails_start', { plant });
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
7. Estimate how commonly the plant is known or owned by the general public and populate the "popularity" field

## JSON Schema
${JSON.stringify(responseStructure)}

## Important Rules
- Return ONLY the JSON object without any explanation, preamble, or additional text
- For 1-10 numeric fields (watering, light, humidity): 1 is lowest and 10 is highest
- For 1-100 numeric fields (popularity): 1 is lowest and 100 is highest
- For confidence scores: use a scale of 0-1 where 0 is no confidence and 1 is complete confidence
- If uncertain about any value, provide your best estimate but assign a lower confidence score
- Ensure all required fields are populated, even with best estimates when exact information is unavailable

Plant: ${plant}`;

  logger.debug('bedrock_prompt', { prompt });
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
    logger.info('bedrock_response', { text });
    return JSON.parse(text) as PlantTaxon;
  } catch (err: any) {
    logger.error('generatePlantDetails_error', { error: err });
    throw err;
  }
}
