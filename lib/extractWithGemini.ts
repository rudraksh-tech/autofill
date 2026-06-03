import type { ExtractedFields, PersonFields, PolicyFields } from "./types";

// ── Empty defaults ────────────────────────────────────────────────────────────

function emptyPerson(): PersonFields {
  return {
    name: "",
    title: "",
    first_name: "",
    surname: "",
    gender: "",
    dob: "",
    address: "",
    mobile: "",
    email: "",
    smoking_status: "",
    pep: "",
    occupation: "",
    height: "",
    weight: "",
    alcohol_per_week: "",
    family_history: "",
    doctor_name: "",
    doctor_address: "",
    doctor_phone: "",
    h1_cancer: "",
    h1_heart: "",
    h1_stroke: "",
    h1_bipolar: "",
    h1_self_harm: "",
    h1_nervous_system: "",
    h1_hiv: "",
    h1_covid: "",
    h2_blood_pressure: "",
    h2_blood_pressure_conditions: "",
    h2_depression: "",
    h2_diabetes: "",
    h2_blood_disorder: "",
    h2_growth: "",
    h2_respiratory: "",
    h2_digestive: "",
    h2_kidney: "",
    h2_gynaecological: "",
    h2_liver: "",
    h3_treatment_4weeks: "",
    h3_treatment_condition: "",
    h3_followup: "",
    h3_specialist: "",
    h3_symptoms_3months: "",
    h4_high_cover: "",
    h4_hobbies: "",
    h4_travel: "",
    chol_awaiting_tests: "",
    chol_complications: "",
    chol_first_noticed: "",
    chol_on_treatment: "",
    chol_stopped_medication: "",
    chol_last_reading: "",
  };
}

function emptyPolicy(): PolicyFields {
  return {
    policy_number: "",
    product: "",
    basis_of_cover: "",
    life_cover_amount: "",
    life_cover_amount_life2: "",
    term: "",
    indexation: "",
    conversion_option: "",
    payment_frequency: "",
    replacing_existing_policy: "",
    policy_owner_different: "",
    policy_under_trust: "",
    purpose_of_cover: "",
    debtor_name: "",
    iban: "",
    bic: "",
    signature_date: "",
    premium: "",
    dep1_name: "",
    dep1_dob: "",
    dep2_name: "",
    dep2_dob: "",
    dep3_name: "",
    dep3_dob: "",
    gross_annual_salary: "",
    net_monthly_income: "",
    other_net_monthly_income: "",
    total_net_monthly_income: "",
    outgoing_mortgage: "",
    outgoing_other_loans: "",
    outgoing_life_savings_pension: "",
    outgoing_regular_expenses: "",
    outgoing_motor_travel: "",
    outgoing_other: "",
    outgoing_total: "",
    asset_home: "",
    asset_mortgage: "",
    asset_deposits: "",
    asset_other_loans: "",
    asset_net: "",
    cover_total_life: "",
    cover_total_illness: "",
    cover_total_phi: "",
    cover_pension_value: "",
    cover_pension_contribution: "",
    cover_target_nra: "",
    employment_occupation: "",
    employment_type: "",
    employment_other_job: "",
    notes: "",
  };
}

const EMPTY_FIELDS: ExtractedFields = {
  policy: emptyPolicy(),
  life1: emptyPerson(),
  life2: emptyPerson(),
};

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a data extraction AI for insurance application documents. Extract ALL fields from the document text.

STRICT RULES:
- NEVER invent, guess, or infer values. If a field is not clearly stated, return "".
- Copy values EXACTLY as they appear in the document.
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- For Yes/No fields, return "Yes" or "No" exactly.
- For single-life policies, leave all life2 fields as "".
- Fields like income, outgoings, assets, dependents are NOT in the Royal London PDF — leave them as "".

Return this exact JSON structure:
{
  "policy": {
    "policy_number": "",
    "product": "",
    "basis_of_cover": "",
    "life_cover_amount": "",
    "life_cover_amount_life2": "",
    "term": "",
    "indexation": "",
    "conversion_option": "",
    "payment_frequency": "",
    "replacing_existing_policy": "",
    "policy_owner_different": "",
    "policy_under_trust": "",
    "purpose_of_cover": "",
    "debtor_name": "",
    "iban": "",
    "bic": "",
    "signature_date": "",
    "premium": "",
    "dep1_name": "",
    "dep1_dob": "",
    "dep2_name": "",
    "dep2_dob": "",
    "dep3_name": "",
    "dep3_dob": "",
    "gross_annual_salary": "",
    "net_monthly_income": "",
    "other_net_monthly_income": "",
    "total_net_monthly_income": "",
    "outgoing_mortgage": "",
    "outgoing_other_loans": "",
    "outgoing_life_savings_pension": "",
    "outgoing_regular_expenses": "",
    "outgoing_motor_travel": "",
    "outgoing_other": "",
    "outgoing_total": "",
    "asset_home": "",
    "asset_mortgage": "",
    "asset_deposits": "",
    "asset_other_loans": "",
    "asset_net": "",
    "cover_total_life": "",
    "cover_total_illness": "",
    "cover_total_phi": "",
    "cover_pension_value": "",
    "cover_pension_contribution": "",
    "cover_target_nra": "",
    "employment_occupation": "",
    "employment_type": "",
    "employment_other_job": "",
    "notes": ""
  },
  "life1": {
    "name": "",
    "title": "",
    "first_name": "",
    "surname": "",
    "gender": "",
    "dob": "",
    "address": "",
    "mobile": "",
    "email": "",
    "smoking_status": "",
    "pep": "",
    "occupation": "",
    "height": "",
    "weight": "",
    "alcohol_per_week": "",
    "family_history": "",
    "doctor_name": "",
    "doctor_address": "",
    "doctor_phone": "",
    "h1_cancer": "",
    "h1_heart": "",
    "h1_stroke": "",
    "h1_bipolar": "",
    "h1_self_harm": "",
    "h1_nervous_system": "",
    "h1_hiv": "",
    "h1_covid": "",
    "h2_blood_pressure": "",
    "h2_blood_pressure_conditions": "",
    "h2_depression": "",
    "h2_diabetes": "",
    "h2_blood_disorder": "",
    "h2_growth": "",
    "h2_respiratory": "",
    "h2_digestive": "",
    "h2_kidney": "",
    "h2_gynaecological": "",
    "h2_liver": "",
    "h3_treatment_4weeks": "",
    "h3_treatment_condition": "",
    "h3_followup": "",
    "h3_specialist": "",
    "h3_symptoms_3months": "",
    "h4_high_cover": "",
    "h4_hobbies": "",
    "h4_travel": "",
    "chol_awaiting_tests": "",
    "chol_complications": "",
    "chol_first_noticed": "",
    "chol_on_treatment": "",
    "chol_stopped_medication": "",
    "chol_last_reading": ""
  },
  "life2": {
    "name": "",
    "title": "",
    "first_name": "",
    "surname": "",
    "gender": "",
    "dob": "",
    "address": "",
    "mobile": "",
    "email": "",
    "smoking_status": "",
    "pep": "",
    "occupation": "",
    "height": "",
    "weight": "",
    "alcohol_per_week": "",
    "family_history": "",
    "doctor_name": "",
    "doctor_address": "",
    "doctor_phone": "",
    "h1_cancer": "",
    "h1_heart": "",
    "h1_stroke": "",
    "h1_bipolar": "",
    "h1_self_harm": "",
    "h1_nervous_system": "",
    "h1_hiv": "",
    "h1_covid": "",
    "h2_blood_pressure": "",
    "h2_blood_pressure_conditions": "",
    "h2_depression": "",
    "h2_diabetes": "",
    "h2_blood_disorder": "",
    "h2_growth": "",
    "h2_respiratory": "",
    "h2_digestive": "",
    "h2_kidney": "",
    "h2_gynaecological": "",
    "h2_liver": "",
    "h3_treatment_4weeks": "",
    "h3_treatment_condition": "",
    "h3_followup": "",
    "h3_specialist": "",
    "h3_symptoms_3months": "",
    "h4_high_cover": "",
    "h4_hobbies": "",
    "h4_travel": "",
    "chol_awaiting_tests": "",
    "chol_complications": "",
    "chol_first_noticed": "",
    "chol_on_treatment": "",
    "chol_stopped_medication": "",
    "chol_last_reading": ""
  }
}`;

// ── Main extraction function ──────────────────────────────────────────────────

export async function extractWithGemini(
  pdfText: string
): Promise<ExtractedFields> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  console.log(
    "[extractWithGemini] PDF text preview (first 500 chars):",
    pdfText.slice(0, 500)
  );

  // Gemini 2.5 Flash Lite via REST API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extract all required fields from the following insurance application document:\n\n${pdfText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Gemini API error ${response.status}: ${errText.slice(0, 300)}`
    );
  }

  const json = await response.json();

  // Extract text from Gemini response structure
  const rawContent: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawContent) {
    console.error("[extractWithGemini] Empty response from Gemini:", JSON.stringify(json));
    return { ...EMPTY_FIELDS };
  }

  // Strip any accidental markdown fences
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: Partial<ExtractedFields>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[extractWithGemini] Non-JSON response:", rawContent.slice(0, 500));
    return { ...EMPTY_FIELDS };
  }

  // Merge with empty defaults so all keys are always present
  const mergedLife1 = { ...emptyPerson(), ...(parsed.life1 ?? {}) };
  const mergedLife2 = { ...emptyPerson(), ...(parsed.life2 ?? {}) };
  const mergedPolicy = { ...emptyPolicy(), ...(parsed.policy ?? {}) };

  return {
    policy: mergedPolicy,
    life1: mergedLife1,
    life2: mergedLife2,
  };
}
