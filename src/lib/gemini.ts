import { GoogleGenAI, Type } from '@google/genai';
import { EstimationItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateEstimation(
  fileBase64: string | null,
  mimeType: string | null,
  manualInput: string,
  templateCategories: string[]
): Promise<{ items: EstimationItem[], estimatedTimeDays: number }> {
  
  const parts: any[] = [];
  
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileBase64,
      }
    });
  }
  
  parts.push({
    text: `Generate a detailed building estimation based on the provided blueprints (if any) and the following manual input: "${manualInput}".
    
    Categorize the items into the following categories: ${templateCategories.join(', ')}.
    For each item, provide a realistic unit cost in Nepalese Rupees (NPR) and quantity based on standard construction rates in Nepal.
    Also estimate the total time in days required for the project.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                unitCost: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['Material', 'Labor', 'Equipment', 'Other'] }
              },
              required: ['category', 'description', 'quantity', 'unit', 'unitCost', 'type']
            }
          },
          estimatedTimeDays: { type: Type.NUMBER }
        },
        required: ['items', 'estimatedTimeDays']
      }
    }
  });

  if (!response.text) {
    throw new Error('Failed to generate estimation');
  }

  const result = JSON.parse(response.text);
  
  // Add IDs and calculate totals
  const items: EstimationItem[] = result.items.map((item: any) => ({
    id: uuidv4(),
    ...item,
    totalCost: item.quantity * item.unitCost
  }));

  return {
    items,
    estimatedTimeDays: result.estimatedTimeDays
  };
}

export async function generateMaterialCalculation(
  fileBase64: string | null,
  mimeType: string | null,
  manualInput: string,
  area: number | ''
): Promise<{ cement: number, sand: number, aggregate: number, steel: number, bricks: number, paints: number, tiles: number }> {
  const parts: any[] = [];
  
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileBase64,
      }
    });
  }
  
  parts.push({
    text: `Analyze the provided blueprint (if any) and manual input: "${manualInput}".
    The total area is ${area || 'unknown'} sq. ft.
    Calculate the required quantities of the following materials for construction:
    - Cement in Bags (50kg)
    - Sand in Cubic Feet (Cu. Ft)
    - Aggregate in Cubic Feet (Cu. Ft)
    - Steel in Kilograms (Kg)
    - Bricks in Pieces
    - Paints in Liters
    - Tiles in Sq. Ft
    
    Provide realistic estimates based on standard construction practices.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cement: { type: Type.NUMBER, description: 'Quantity of Cement in Bags' },
          sand: { type: Type.NUMBER, description: 'Quantity of Sand in Cu. Ft' },
          aggregate: { type: Type.NUMBER, description: 'Quantity of Aggregate in Cu. Ft' },
          steel: { type: Type.NUMBER, description: 'Quantity of Steel in Kg' },
          bricks: { type: Type.NUMBER, description: 'Quantity of Bricks in Pieces' },
          paints: { type: Type.NUMBER, description: 'Quantity of Paints in Liters' },
          tiles: { type: Type.NUMBER, description: 'Quantity of Tiles in Sq. Ft' }
        },
        required: ['cement', 'sand', 'aggregate', 'steel', 'bricks', 'paints', 'tiles']
      }
    }
  });

  if (!response.text) {
    throw new Error('Failed to generate material calculation');
  }

  return JSON.parse(response.text);
}
