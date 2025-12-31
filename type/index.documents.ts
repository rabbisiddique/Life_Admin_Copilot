export interface Document {
  id: string;
  title: string;
  file_type: string;
  expiry_date: string;
  status: "valid" | "expiring" | "expired";
  upload_date: string;
  category: "identity" | "insurance" | "license" | "contract" | "other";
  file_url: string;
  file_size: number;
  extraction_status?:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "manual";
  ai_confidence_score?: number;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
}
