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
  aliases: ["<common names>"],
  watering: { value: 1-10, confidence: 0-1 },
  light: { value: 1-10, confidence: 0-1 },
  humidity: { value: 1-10, confidence: 0-1 },
  popularity: { value: 1-100, confidence: 0-1 },
  soil: { value: "sandy | loamy | saline | peaty | clay | silt | chalky", confidence: 0-1 },
  lifeCycle: { value: "annual | biennial | perennial", confidence: 0-1 },
  leafRetention: { value: "evergreen | deciduous | semi-deciduous", confidence: 0-1 },
  rootType: { value: "shallow | deep | fibrous | rhizome | tuberous", confidence: 0-1 },
  repottingFrequency: { value: "yearly | 2-3 years | rarely", confidence: 0-1 },
  feeding: { value: "light | moderate | heavy", confidence: 0-1 },
  toxicity: { value: "<toxicity>", confidence: 0-1 },
  origin: { value: "<origin>", confidence: 0-1 },
  nativeHeight: { value: "<height in metres>", confidence: 0-1 },
  leafSize: { value: "<size>", confidence: 0-1 },
  growthRate: { value: "<growthRate>", confidence: 0-1 },
  maintenanceLevel: { value: "<maintenanceLevel>", confidence: 0-1 },
  airPurifying: { value: "<yes/no/strong>", confidence: 0-1 },
  petFriendly: { value: "<yes/no>", confidence: 0-1 },
  frostTolerance: { value: "<minimum °C>", confidence: 0-1 },
  heatTolerance: { value: "<maximum °C>", confidence: 0-1 },
};

export async function generatePlantDetails(plant: string, logger: any): Promise<PlantTaxon> {
  logger.info('generatePlantDetails_start', { plant });
  const prompt = `Task
Generate a single JSON object containing detailed care information, tolerances, and taxonomy for the specified plant.

Instructions
1. Analyse the provided plant name.
2. Fill the JSON using the exact schema below.
3. Assign confidence scores (0–1) based on reliability.
4. Estimate how well-known or commonly owned the plant is and populate popularity.
5. Provide up to 5 aliases using the most commonly used names.
6. Output only the JSON object.

JSON Schema
${JSON.stringify(responseStructure)}

Rules
- Return only the JSON.
- Use 1–10 for watering, light, humidity.
- Use 1–100 for popularity.
- If uncertain, estimate and lower the confidence.

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
