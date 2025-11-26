import { DocumentScanner } from "@/components/documents/document-scanner";

export default function DocumentsPage() {
  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            <DocumentScanner />
          </div>
        </div>
      </div>
    </>
  );
}
