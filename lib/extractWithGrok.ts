// NOTE: This file is kept as a backup/reference for the original Groq-based extraction.
// It uses its own local type to avoid conflicts with the updated ExtractedFields in types.ts.
// The active extraction uses extractWithGemini.ts instead.

import OpenAI from "openai";

// Local flat type — intentionally separate from the main ExtractedFields
interface GrokExtractedFields {
  name: string;
  address: string;
  dob: string;
  occupation: string;
  smoking_status: string;
  mobile: string;
  email: string;
}

const EMPTY_FIELDS: GrokExtractedFields = {
  name: "",
  address: "",
  dob: "",
  occupation: "",
  smoking_status: "",
  mobile: "",
  email: "",
};

const SYSTEM_PROMPT = `You are a data extraction AI. Your ONLY job is to find and copy values that are EXPLICITLY present in the document text provided by the user.

STRICT RULES:
- NEVER invent, guess, or infer values. If a field is not clearly stated in the text, return "".
- NEVER use example data, training data, or prior knowledge to fill fields.
- Copy values EXACTLY as they appear in the document — do not reformat or paraphrase.
- Return ONLY valid JSON. No markdown, no code fences, no explanation, no extra keys.

FIELDS TO EXTRACT:
- name: The full name of the policy holder or applicant (e.g. "Mr John Smith")
- address: The full postal address of the applicant
- dob: Date of birth of the applicant (any format found in the document)
- occupation: The stated occupation or job title
- smoking_status: Whether the person is a smoker or non-smoker
- mobile: Mobile or phone number
- email: Email address

JSON FORMAT (return exactly this structure):
{
  "name": "",
  "address": "",
  "dob": "",
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
): Promise<GrokExtractedFields> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  // Log first 500 chars of PDF text so you can verify what's actually being sent to the LLM
  console.log("[extractWithGrok] PDF text preview (first 500 chars):", pdfText.slice(0, 500));

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

  let parsed: Partial<GrokExtractedFields>;
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
    occupation: parsed.occupation ?? "",
    smoking_status: parsed.smoking_status ?? "",
    mobile: parsed.mobile ?? "",
    email: parsed.email ?? "",
  };
}
