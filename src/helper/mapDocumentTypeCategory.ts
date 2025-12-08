export const mapDocumentTypeToCategory = (
  docType: string
): "identity" | "insurance" | "license" | "contract" | "other" => {
  const normalized = docType.toLowerCase().trim();

  // Identity documents
  if (
    normalized.includes("passport") ||
    normalized.includes("id") ||
    normalized.includes("birth certificate") ||
    normalized.includes("citizenship")
  ) {
    return "identity";
  }

  // Insurance documents
  if (
    normalized.includes("insurance") ||
    normalized.includes("policy") ||
    normalized.includes("health card")
  ) {
    return "insurance";
  }

  // License documents
  if (
    normalized.includes("license") ||
    normalized.includes("licence") ||
    normalized.includes("permit")
  ) {
    return "license";
  }

  // Contract documents
  if (
    normalized.includes("contract") ||
    normalized.includes("agreement") ||
    normalized.includes("deed")
  ) {
    return "contract";
  }

  return "other";
};
