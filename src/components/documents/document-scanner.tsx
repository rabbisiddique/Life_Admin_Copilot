"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapDocumentTypeToCategory } from "@/helper/mapDocumentTypeCategory";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  Info,
  Loader,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { extractDocument } from "../../../actions/dcouments";
import {
  createExpiryNotification,
  createRenewNotification,
} from "../../../actions/notifications";
import { createClient } from "../../../lib/supabase/client";
import { uploadFile } from "../../../lib/uploadFile";
import { Document } from "../../../type/index.documents";
import Spinner from "../Spinner/Spinner";
import StatCard from "../stat-card/StatCard";

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Document Form Component (reusable for both Dialog and Drawer)
function DocumentForm({
  uploadForm,
  setUploadForm,
  handleFileSelect,
  handleUpload,
  isUploading,
  isExtracting,
  extractedData,
  extractionError,
}: any) {
  return (
    <div className="grid gap-4 py-4">
      {/* File Input */}
      <div className="grid gap-2">
        <Label htmlFor="file" className="text-sm font-semibold">
          Select Document
        </Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="cursor-pointer h-11"
        />
        {uploadForm.file && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {uploadForm.file.name}
            </span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* AI Toggle */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <input
          type="checkbox"
          id="useAI"
          checked={uploadForm.useAI}
          onChange={(e) =>
            setUploadForm({
              ...uploadForm,
              useAI: e.target.checked,
            })
          }
          className="h-4 w-4 rounded border-purple-300"
        />
        <Label
          htmlFor="useAI"
          className="text-xs sm:text-sm cursor-pointer flex items-center gap-2 flex-1"
        >
          <Brain className="h-4 w-4 text-purple-500 shrink-0" />
          <div>
            <div className="font-semibold">Use AI Extraction</div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Auto-extract details using Claude AI
            </div>
          </div>
        </Label>
      </div>

      {/* Extraction Status */}
      {isExtracting && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400">
              AI analyzing...
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              This may take a few seconds
            </div>
          </div>
        </div>
      )}

      {/* Extraction Success */}
      {extractedData && !isExtracting && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400">
              Extraction Complete!
            </span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {Math.round((extractedData.confidence || 0) * 100)}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Review the info below</p>
        </div>
      )}

      {/* Extraction Error */}
      {extractionError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400">
              Extraction Failed
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Please fill in manually
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="doc-name" className="text-sm">
            Document Name *
          </Label>
          <Input
            id="doc-name"
            placeholder="e.g. Passport"
            value={uploadForm.title}
            onChange={(e) =>
              setUploadForm({
                ...uploadForm,
                title: e.target.value,
              })
            }
            className="h-11"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="doc-category" className="text-sm">
            Category *
          </Label>
          <Select
            value={uploadForm.category}
            onValueChange={(val) =>
              setUploadForm({ ...uploadForm, category: val })
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="identity">🪪 Identity</SelectItem>
              <SelectItem value="insurance">🛡️ Insurance</SelectItem>
              <SelectItem value="license">📜 License</SelectItem>
              <SelectItem value="contract">📄 Contract</SelectItem>
              <SelectItem value="other">📁 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="expiry-date" className="text-sm">
              Expiry Date
            </Label>
            <Input
              id="expiry-date"
              type="date"
              value={uploadForm.expiryDate}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  expiryDate: e.target.value,
                })
              }
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="doc-number" className="text-sm">
              Document Number
            </Label>
            <Input
              id="doc-number"
              placeholder="e.g. AB123456"
              value={uploadForm.documentNumber}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  documentNumber: e.target.value,
                })
              }
              className="h-11"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="issue-date" className="text-sm">
              Issue Date
            </Label>
            <Input
              id="issue-date"
              type="date"
              value={uploadForm.issueDate}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  issueDate: e.target.value,
                })
              }
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="issuing-auth" className="text-sm">
              Issuing Authority
            </Label>
            <Input
              id="issuing-auth"
              placeholder="e.g. Government"
              value={uploadForm.issuingAuthority}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  issuingAuthority: e.target.value,
                })
              }
              className="h-11"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={isUploading || isExtracting || !uploadForm.file}
        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </>
        )}
      </Button>
    </div>
  );
}

export default function DocumentScanner() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "",
    expiryDate: "",
    file: null as File | null,
    useAI: true,
    documentNumber: "",
    issuingAuthority: "",
    issueDate: "",
  });

  const supabase = createClient();
  const isMobile = useIsMobile();

  // Calculate status based on expiry date
  const calculateStatus = (
    expiryDate: string
  ): "valid" | "expiring" | "expired" => {
    if (!expiryDate) return "valid";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return "expired";
    if (daysUntil <= 30) return "expiring";
    return "valid";
  };

  // Fetch documents from Supabase
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login first");
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false });

      if (error) throw error;

      const docsWithStatus = (data || []).map((doc) => ({
        ...doc,
        status: calculateStatus(doc.expiry_date),
      }));

      setDocuments(docsWithStatus);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documents.length === 0 && isLoading) return;

    const channel = supabase
      .channel("documents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDocuments((prev) => [payload.new as Document, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === payload.new.id ? (payload.new as Document) : d
              )
            );
          } else if (payload.eventType === "DELETE") {
            setDocuments((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoading]);

  // AI Extraction
  const extractDataWithAI = async (file: File) => {
    setIsExtracting(true);
    setExtractionError("");
    setExtractedData(null);

    try {
      const res = await extractDocument(file);
      console.log(res);

      const extracted = res.data;
      setExtractedData(extracted);
      toast.success("AI extraction successful!");

      setUploadForm((prev) => ({
        ...prev,
        title: extracted?.document_name || prev.title,
        category: extracted?.document_type
          ? mapDocumentTypeToCategory(extracted.document_type)
          : prev.category,
        expiryDate: extracted?.expiry_date || prev.expiryDate,
        documentNumber: extracted?.document_number || prev.documentNumber,
        issuingAuthority: extracted?.issuing_authority || prev.issuingAuthority,
        issueDate: extracted?.issue_date || prev.issueDate,
      }));

      return extracted;
    } catch (err: any) {
      console.error("AI extraction error:", err);
      setExtractionError(err.message || "Extraction failed.");
      toast.error("AI extraction failed. Please enter manually.");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setUploadForm((prev) => ({ ...prev, file }));
    setExtractionError("");
    setExtractedData(null);
    toast.loading("✨ AI analyzing document...", {
      id: "ai-extract",
    });
    if (uploadForm.useAI) {
      await extractDataWithAI(file);
    }
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadForm.title || !uploadForm.category) {
      toast.error("Please fill in document title and category");
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileUrl = await uploadFile(uploadForm.file);
      if (!fileUrl) throw new Error("Failed to upload file");

      let issueDate = uploadForm.issueDate
        ? new Date(uploadForm.issueDate)
        : new Date();

      let expiryDate = uploadForm.expiryDate
        ? new Date(uploadForm.expiryDate)
        : null;

      if (expiryDate && expiryDate < issueDate) {
        expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      const documentData: any = {
        user_id: user.id,
        title: uploadForm.title,
        category: uploadForm.category,
        file_type: uploadForm.file.type || "application/pdf",
        file_path: `${user.id}/${Date.now()}_${uploadForm.file.name}`,
        file_url: fileUrl,
        file_size: uploadForm.file.size,
        extraction_status: uploadForm.useAI ? "completed" : "manual",
        status: expiryDate
          ? calculateStatus(expiryDate.toISOString().split("T")[0])
          : "valid",
      };

      if (expiryDate)
        documentData.expiry_date = expiryDate.toISOString().split("T")[0];
      if (uploadForm.documentNumber)
        documentData.document_number = uploadForm.documentNumber;
      if (uploadForm.issuingAuthority)
        documentData.issuing_authority = uploadForm.issuingAuthority;
      if (issueDate)
        documentData.issue_date = issueDate.toISOString().split("T")[0];
      if (extractedData?.confidence)
        documentData.ai_confidence_score = extractedData.confidence;

      const { data: insertedDocs, error } = await supabase
        .from("documents")
        .insert([documentData])
        .select();

      if (error) throw error;

      if (expiryDate) {
        await createExpiryNotification(
          user.id,
          "Document Expiry Alert",
          `Your document "${uploadForm.title}" will expire in 2 days!`,
          "document",
          `/documents`,
          expiryDate.toISOString().split("T")[0]
        );
      }

      toast.success("Document uploaded successfully!");

      setUploadForm({
        title: "",
        category: "",
        expiryDate: "",
        file: null,
        useAI: true,
        documentNumber: "",
        issuingAuthority: "",
        issueDate: "",
      });
      setExtractedData(null);
      setExtractionError("");
      setIsUploadOpen(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) throw error;
      toast.success("Document removed successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete document");
    }
  };

  // Renew document
  const handleRenew = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;

      const newDate = new Date();
      newDate.setFullYear(newDate.getFullYear() + 1);
      const newExpiryDate = newDate.toISOString().split("T")[0];
      const newStatus = calculateStatus(newExpiryDate);

      const { error } = await supabase
        .from("documents")
        .update({
          expiry_date: newExpiryDate,
          status: newStatus,
        })
        .eq("id", id);

      if (error) throw error;

      await createRenewNotification(
        user!.id,
        "Document Renewed",
        `Your document has been successfully renewed!`,
        "document",
        `/documents`
      );

      toast.success("Document renewed for 1 year", { id: "documents action" });
    } catch (err) {
      console.error("Renew error:", err);
      toast.error("Failed to renew document");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setIsUploadOpen(true);
      await handleFileSelect(files[0]);
    }
  };

  // UI Helper functions
  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "valid":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "expiring":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "expired":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    }
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "expiring":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-rose-500" />;
    }
  };

  const getCategoryIcon = (category: Document["category"]) => {
    const icons = {
      identity: "🪪",
      insurance: "🛡️",
      license: "📜",
      contract: "📄",
      other: "📁",
    };
    return icons[category];
  };

  const getExtractionBadge = (doc: Document) => {
    if (!doc.extraction_status || doc.extraction_status === "manual")
      return null;

    const badges = {
      completed: {
        icon: Sparkles,
        color:
          "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200",
        text: "AI",
      },
      processing: {
        icon: Loader,
        color:
          "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200",
        text: "Processing",
      },
      failed: {
        icon: XCircle,
        color:
          "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200",
        text: "Failed",
      },
      pending: {
        icon: Clock,
        color:
          "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200",
        text: "Pending",
      },
    };

    const badge = badges[doc.extraction_status];
    const Icon = badge.icon;

    return (
      <Badge variant="secondary" className={`${badge.color} border text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">{badge.text}</span>
        {doc.ai_confidence_score && (
          <span className="hidden sm:inline">
            : {Math.round(doc.ai_confidence_score * 100)}%
          </span>
        )}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc?.title
      ?.toLowerCase()
      .includes(searchQuery?.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: documents.length,
    expiring: documents.filter((d) => d.status === "expiring").length,
    expired: documents.filter((d) => d.status === "expired").length,
    aiProcessed: documents.filter((d) => d.extraction_status === "completed")
      .length,
  };

  const daysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return 0;
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days;
  };

  if (isLoading) {
    return <Spinner title="Loading documents..." />;
  }

  const DocumentFormModal = isMobile ? (
    <Drawer open={isUploadOpen} onOpenChange={setIsUploadOpen}>
      <DrawerTrigger asChild>
        <Button
          size="default"
          className="h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Upload Document
            </DrawerTitle>
            <DrawerDescription>AI will auto-extract details</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <DocumentForm
              uploadForm={uploadForm}
              setUploadForm={setUploadForm}
              handleFileSelect={handleFileSelect}
              handleUpload={handleUpload}
              isUploading={isUploading}
              isExtracting={isExtracting}
              extractedData={extractedData}
              extractionError={extractionError}
            />
          </div>
          <DrawerFooter className="mt-[-19px]">
            <DrawerClose asChild>
              <Button variant="outline" className="h-11">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Upload className="mr-2 h-5 w-5" />
          Choose Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Upload New Document
          </DialogTitle>
        </DialogHeader>
        <DocumentForm
          uploadForm={uploadForm}
          setUploadForm={setUploadForm}
          handleFileSelect={handleFileSelect}
          handleUpload={handleUpload}
          isUploading={isUploading}
          isExtracting={isExtracting}
          extractedData={extractedData}
          extractionError={extractionError}
        />
      </DialogContent>
    </Dialog>
  );

  const activeFilters = filterCategory !== "all" ? 1 : 0;

  return (
    <div className="space-y-4 sm:space-y-6 sm:p-4 md:p-6 mx-auto max-w-7xl w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          AI Document Manager
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Auto-extract expiry dates with AI-powered analysis
        </p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid gap-1.5 sm:gap-2 md:gap-3 grid-cols-2 lg:grid-cols-4 w-full">
        <StatCard
          label="Total Documents"
          shortLabel="Total"
          value={stats.total}
          color="text-primary"
        />
        <StatCard
          label="AI Processed"
          shortLabel="AI"
          value={stats.aiProcessed}
          color="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Expiring Soon"
          shortLabel="Expiring"
          value={stats.expiring}
          color="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Expired"
          shortLabel="Expired"
          value={stats.expired}
          color="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Upload Area */}
      <Card className="border-0 shadow-lg overflow-hidden w-full max-w-full">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-6 sm:p-8 md:p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105"
                : "border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-950/10 hover:border-purple-400 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Upload
                className={`h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 transition-transform ${
                  isDragging ? "scale-110" : ""
                }`}
              />
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-purple-500 animate-pulse" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
              AI-Powered Upload
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-4 sm:mb-6 max-w-lg mx-auto px-4">
              Drop files here or click to upload. AI will auto-extract details.
            </p>
            {DocumentFormModal}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="w-full max-w-full">
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Your Documents
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Manage and track your important documents with AI insights
              </CardDescription>
            </div>

            {/* Search and Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 md:h-10"
                />
                {searchQuery && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filter and Upload Button */}
              <div className="flex gap-2">
                {/* Mobile: Filter Toggle Button */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden h-11 flex-1"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilters > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeFilters}
                    </span>
                  )}
                </Button>

                {/* Desktop: Filter Dropdown */}
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="hidden sm:flex w-[140px] h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="identity">Identity</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {DocumentFormModal}
              </div>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && isMobile && (
              <Card className="p-4 border-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Category</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={filterCategory}
                    onValueChange={(value) => {
                      setFilterCategory(value);
                      setShowFilters(false);
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="identity">Identity</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="license">License</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {activeFilters > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterCategory("all");
                        setShowFilters(false);
                      }}
                      className="w-full"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 pt-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground px-4">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-2" />
                <p className="text-base sm:text-lg font-medium">
                  No documents found
                </p>
                <p className="text-sm">
                  {searchQuery || activeFilters > 0
                    ? "Try adjusting your filters"
                    : "Upload your first document to get started"}
                </p>
                {(searchQuery || activeFilters > 0) && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterCategory("all");
                    }}
                    className="text-sm mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[500px] sm:h-[600px] pr-2 sm:pr-4">
              <div className="space-y-2 sm:space-y-3">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4 transition-all hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.01]"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-2xl sm:text-3xl font-bold shadow-md shrink-0">
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm sm:text-base truncate">
                            {doc.title}
                          </h4>
                          <div className="shrink-0">
                            {getStatusIcon(doc.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {doc.expiry_date && (
                            <>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="font-medium">
                                  {new Date(
                                    doc.expiry_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-semibold">
                                {daysUntilExpiry(doc.expiry_date) > 0 ? (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {daysUntilExpiry(doc.expiry_date)}d left
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400">
                                    Expired
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                            {doc.category}
                          </span>
                        </div>
                        {doc.document_number && (
                          <div className="mt-1 text-xs text-muted-foreground hidden sm:block">
                            <Info className="inline h-3 w-3 mr-1" />
                            {doc.document_number}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(
                          doc.status
                        )} border capitalize font-semibold text-xs shrink-0`}
                      >
                        {doc.status}
                      </Badge>

                      {getExtractionBadge(doc)}

                      <div className="flex gap-1 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(doc.file_url)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRenew(doc.id)}
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          title="Renew"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
