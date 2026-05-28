import OpenAI from "openai";
import type { ExtractedFields } from "./types";

const EMPTY_FIELDS: ExtractedFields = {
  name: "",
  address: "",
  dob: "",
  annual_income: "",
  income_protection_benefit: "",
  deferral_period: "",
  occupation: "",
  smoking_status: "",
  mobile: "",
  email: "",
};

const SYSTEM_PROMPT = `You are a professional insurance document extraction AI.
Extract the required fields from the provided insurance/application PDF text.
Return ONLY valid JSON with no markdown, no code fences, no explanation.
If any field is missing, return empty string for that field.
JSON FORMAT:
{
  "name": "",
  "address": "",
  "dob": "",
  "annual_income": "",
  "income_protection_benefit": "",
  "deferral_period": "",
  "occupation": "",
  "smoking_status": "",
  "mobile": "",
  "email": ""
}`;

/**
 * Sends extracted PDF text to the Groq API and returns parsed fields.
 */
export async function extractWithGrok(
  pdfText: string
): Promise<ExtractedFields> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Extract the required fields from the following insurance document text:\n\n${pdfText}`,
      },
    ],
    temperature: 0,
  });

  const rawContent = response.choices[0]?.message?.content ?? "";

  // Safely parse JSON — strip any accidental markdown fences
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: Partial<ExtractedFields>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Grok returned non-JSON content:", rawContent);
    return { ...EMPTY_FIELDS };
  }

  // Merge with empty defaults so all keys are always present
  return {
    name: parsed.name ?? "",
    address: parsed.address ?? "",
    dob: parsed.dob ?? "",
    annual_income: parsed.annual_income ?? "",
    income_protection_benefit: parsed.income_protection_benefit ?? "",
    deferral_period: parsed.deferral_period ?? "",
    occupation: parsed.occupation ?? "",
    smoking_status: parsed.smoking_status ?? "",
    mobile: parsed.mobile ?? "",
    email: parsed.email ?? "",
  };
}
