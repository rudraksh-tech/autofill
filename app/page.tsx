"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import type { ExtractedFields, PersonFields, UploadResponse } from "@/lib/types";

type AppState = "idle" | "uploading" | "success" | "error";

// Human-readable labels for person fields
const PERSON_FIELD_LABELS: Partial<Record<keyof PersonFields, string>> = {
  name: "Full Name",
  dob: "Date of Birth",
  occupation: "Occupation",
  address: "Address",
  mobile: "Mobile",
  email: "Email",
  smoking_status: "Smoking Status",
  gender: "Gender",
  height: "Height",
  weight: "Weight",
  alcohol_per_week: "Alcohol / Week",
  doctor_name: "Doctor Name",
  doctor_address: "Doctor Address",
  h2_blood_pressure: "Raised BP / Cholesterol",
  h2_blood_pressure_conditions: "BP/Chol Conditions",
  h3_treatment_4weeks: "Treatment 4+ Weeks",
  h3_treatment_condition: "Treatment Condition",
  chol_first_noticed: "Cholesterol First Noticed",
  chol_last_reading: "Last Cholesterol Reading",
};

// Which person fields to show in the summary (most important ones)
const SUMMARY_KEYS: Array<keyof PersonFields> = [
  "name", "dob", "occupation", "address", "mobile", "email",
  "smoking_status", "gender", "height", "weight",
  "doctor_name", "h2_blood_pressure", "h2_blood_pressure_conditions",
  "h3_treatment_4weeks", "h3_treatment_condition",
  "chol_first_noticed", "chol_last_reading",
];

function PersonCard({ title, person }: { title: string; person: PersonFields }) {
  const hasData = SUMMARY_KEYS.some((k) => person[k]);
  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {SUMMARY_KEYS.map((key) => {
          const val = person[key];
          if (!val) return null;
          return (
            <div key={key} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-xs text-gray-400 w-44 shrink-0 pt-0.5">
                {PERSON_FIELD_LABELS[key] ?? key}
              </span>
              <span className="text-xs text-gray-800 break-all font-medium">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [state, setState] = useState<AppState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadUrl2, setDownloadUrl2] = useState<string | null>(null);
  const [downloadUrl3, setDownloadUrl3] = useState<string | null>(null);
  const [fields, setFields] = useState<ExtractedFields | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setState("idle");
    setSelectedFile(null);
    setDownloadUrl(null);
    setDownloadUrl2(null);
    setDownloadUrl3(null);
    setFields(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are accepted.";
    }
    if (file.size > 20 * 1024 * 1024) {
      return "File size must be under 20 MB.";
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setState("error");
      return;
    }
    setSelectedFile(file);
    setState("idle");
    setErrorMessage("");
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setState("uploading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }

      setDownloadUrl(data.downloadUrl ?? null);
      setDownloadUrl2(data.downloadUrl2 ?? null);
      setDownloadUrl3(data.downloadUrl3 ?? null);
      setFields(data.fields ?? null);
      setState("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setState("error");
    }
  };

  const isDualLife = fields && fields.life2 && fields.life2.name !== "";

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AutoFill</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Upload a Royal London Ireland PDF — we extract all fields and fill your DOCX templates automatically.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
              cursor-pointer transition-all duration-200 p-10
              ${dragOver
                ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
                : selectedFile
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleInputChange}
            />

            {selectedFile ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-emerald-700 font-semibold text-sm">{selectedFile.name}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-sm">
                    {dragOver ? "Drop your PDF here" : "Drag & drop your PDF here"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">or click to browse · PDF only · max 20 MB</p>
                </div>
              </>
            )}
          </div>

          {/* Error message */}
          {state === "error" && errorMessage && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Upload Button */}
          {state !== "success" && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || state === "uploading"}
              className={`
                w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200
                flex items-center justify-center gap-2
                ${!selectedFile || state === "uploading"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98]"
                }
              `}
            >
              {state === "uploading" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Extract & Generate DOCX
                </>
              )}
            </button>
          )}

          {/* Loading steps */}
          {state === "uploading" && (
            <div className="space-y-2">
              {[
                "Parsing PDF text…",
                "Extracting all fields with Gemini AI…",
                "Filling DOCX templates…",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  {step}
                </div>
              ))}
            </div>
          )}

          {/* Success state */}
          {state === "success" && (
            <div className="space-y-4">

              {/* Success banner */}
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-emerald-700 text-sm font-medium">
                  Documents generated successfully!
                  {isDualLife && (
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">Dual Life</span>
                  )}
                </p>
              </div>

              {/* Policy summary */}
              {fields?.policy?.policy_number && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy Details</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      ["Policy Number", fields.policy.policy_number],
                      ["Product", fields.policy.product],
                      ["Basis", fields.policy.basis_of_cover],
                      ["Life Cover (Life 1)", fields.policy.life_cover_amount],
                      ["Life Cover (Life 2)", fields.policy.life_cover_amount_life2],
                      ["Term", fields.policy.term],
                      ["Payment", fields.policy.payment_frequency],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label} className="flex items-start gap-3 px-4 py-2.5">
                          <span className="text-xs text-gray-400 w-44 shrink-0 pt-0.5">{label}</span>
                          <span className="text-xs text-gray-800 break-all font-medium">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Extracted person fields */}
              {fields && (
                <>
                  <PersonCard title="Life 1 — Personal Details" person={fields.life1} />
                  {isDualLife && (
                    <PersonCard title="Life 2 — Personal Details" person={fields.life2} />
                  )}
                </>
              )}

              {/* Download + Reset buttons */}
              <div className="flex flex-wrap gap-3">
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Template 1
                  </a>
                )}
                {downloadUrl2 && (
                  <a
                    href={downloadUrl2}
                    download
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Template 2
                  </a>
                )}
                {downloadUrl3 && (
                  <a
                    href={downloadUrl3}
                    download
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Template 2.1
                  </a>
                )}
                <button
                  onClick={resetState}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  New Upload
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Contact Rudraksh Jhaveri to add your own your <code className="text-gray-500">template.docx</code> files in the <code className="text-gray-500">templates/</code> folder
        </p>
      </div>
    </main>
  );
}
