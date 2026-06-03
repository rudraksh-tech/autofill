// ── Single person's details ──────────────────────────────────────────────────
export interface PersonFields {
  // Personal
  name: string;
  title: string;
  first_name: string;
  surname: string;
  gender: string;
  dob: string;
  address: string;
  mobile: string;
  email: string;
  smoking_status: string;
  pep: string; // Politically Exposed Person

  // Employment
  occupation: string;

  // Lifestyle
  height: string;
  weight: string;
  alcohol_per_week: string;
  family_history: string;

  // Doctor
  doctor_name: string;
  doctor_address: string;
  doctor_phone: string;

  // Health 1 (ever had)
  h1_cancer: string;
  h1_heart: string;
  h1_stroke: string;
  h1_bipolar: string;
  h1_self_harm: string;
  h1_nervous_system: string;
  h1_hiv: string;
  h1_covid: string;

  // Health 2 (last 5 years)
  h2_blood_pressure: string;
  h2_blood_pressure_conditions: string;
  h2_depression: string;
  h2_diabetes: string;
  h2_blood_disorder: string;
  h2_growth: string;
  h2_respiratory: string;
  h2_digestive: string;
  h2_kidney: string;
  h2_gynaecological: string;
  h2_liver: string;

  // Health 3 (last 3 years)
  h3_treatment_4weeks: string;
  h3_treatment_condition: string;
  h3_followup: string;
  h3_specialist: string;
  h3_symptoms_3months: string;

  // Health 4 (hobbies/travel)
  h4_high_cover: string;
  h4_hobbies: string;
  h4_travel: string;

  // Raised cholesterol detail (if applicable)
  chol_awaiting_tests: string;
  chol_complications: string;
  chol_first_noticed: string;
  chol_on_treatment: string;
  chol_stopped_medication: string;
  chol_last_reading: string;
}

// ── Policy-level details ─────────────────────────────────────────────────────
export interface PolicyFields {
  policy_number: string;
  product: string;
  basis_of_cover: string; // "Single Life" | "Dual Life"
  life_cover_amount: string;
  life_cover_amount_life2: string;
  term: string;
  indexation: string;
  conversion_option: string;
  payment_frequency: string;
  replacing_existing_policy: string;
  policy_owner_different: string;
  policy_under_trust: string;
  purpose_of_cover: string;

  // SEPA / bank
  debtor_name: string;
  iban: string;
  bic: string;
  signature_date: string;

  // Statement of Suitability (template3)
  premium: string;

  // Fact Find — Dependents
  dep1_name: string;
  dep1_dob: string;
  dep2_name: string;
  dep2_dob: string;
  dep3_name: string;
  dep3_dob: string;

  // Fact Find — Income
  gross_annual_salary: string;
  net_monthly_income: string;
  other_net_monthly_income: string;
  total_net_monthly_income: string;

  // Fact Find — Regular Outgoings
  outgoing_mortgage: string;
  outgoing_other_loans: string;
  outgoing_life_savings_pension: string;
  outgoing_regular_expenses: string;
  outgoing_motor_travel: string;
  outgoing_other: string;
  outgoing_total: string;

  // Fact Find — Assets & Liabilities
  asset_home: string;
  asset_mortgage: string;
  asset_deposits: string;
  asset_other_loans: string;
  asset_net: string;

  // Fact Find — Life/Illness/PHI
  cover_total_life: string;
  cover_total_illness: string;
  cover_total_phi: string;
  cover_pension_value: string;
  cover_pension_contribution: string;
  cover_target_nra: string;

  // Fact Find — Employment Details
  employment_occupation: string;
  employment_type: string;
  employment_other_job: string;

  // Fact Find — Notes
  notes: string;
}

// ── Top-level extracted structure ────────────────────────────────────────────
export interface ExtractedFields {
  policy: PolicyFields;
  life1: PersonFields;
  life2: PersonFields; // empty strings when single life
}

// ── API response ─────────────────────────────────────────────────────────────
export interface UploadResponse {
  success: boolean;
  downloadUrl?: string;
  downloadUrl2?: string;
  downloadUrl3?: string;
  fields?: ExtractedFields;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
}
