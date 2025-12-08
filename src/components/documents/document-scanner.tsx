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
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { extractDocument } from "../../../actions/dcouments";
import { createClient } from "../../../lib/supabase/client";
import { Document } from "../../../type/index.documents";
import Spinner from "../Spinner/Spinner";

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

  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "",
    expiryDate: "",
    file: null as File | null,
    useAI: true,
    documentNumber: "",
    issuingAuthority: "",
    issueDate: "",
  });

  const supabase = createClient();

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

      // Calculate status for each document
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
    // Don't set up real-time until we have initial data
    if (documents.length === 0 && isLoading) return;

    const channel = supabase
      .channel("documents-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "documents" },
        (payload) => {
          console.log("Realtime UPDATE payload:", payload);

          // Use payload.new directly - it contains the updated bill
          setDocuments((prev) =>
            prev.map((b) =>
              b.id === payload.new.id ? (payload.new as Document) : b
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "documents" },
        (payload) => {
          console.log("Realtime INSERT payload:", payload);
          setDocuments((prev) => [payload.new as Document, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "documents" },
        (payload) => {
          console.log("Realtime DELETE payload:", payload);
          setDocuments((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log("Channel subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to documents changes");
        }
      });

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [isLoading]); // Only re-subscribe if loading state changes
  // AI Extraction using Claude API
  const extractDataWithAI = async (file: File) => {
    setIsExtracting(true);
    setExtractionError("");
    setExtractedData(null);

    try {
      console.log("Uploading file to OpenAI…");
      const res = await extractDocument(file);

      console.log(res);
      const extracted = res.data;
      setExtractedData(extracted);
      toast.success("AI extraction successful!");

      // Autofill upload form
      setUploadForm((prev) => ({
        ...prev,
        name: extracted?.document_name || prev.name,
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

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setUploadForm((prev) => ({ ...prev, file }));
    setExtractionError("");
    setExtractedData(null);
    toast.loading("✨ AI is diving into your document... sit tight!", {
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

    if (!uploadForm.name || !uploadForm.category) {
      toast.error("Please fill in document name and category");
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileUrl = await uploadFile(uploadForm.file);
      if (!fileUrl) throw new Error("Failed to upload file");

      // Prepare dates
      let issueDate = uploadForm.issueDate
        ? new Date(uploadForm.issueDate)
        : new Date(); // default to today

      let expiryDate = uploadForm.expiryDate
        ? new Date(uploadForm.expiryDate)
        : null;

      // Ensure expiry date is not before issue date
      if (expiryDate && expiryDate < issueDate) {
        // toast.error(
        //   "Expiry date cannot be before issue date. Adjusting expiry to 1 year after issue date."
        // );
        expiryDate = new Date(issueDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      const documentData: any = {
        user_id: user.id,
        name: uploadForm.name,
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

      // Insert into database
      const { error } = await supabase.from("documents").insert([documentData]);
      if (error) throw error;

      toast.success("Document uploaded successfully!");

      // Reset form
      setUploadForm({
        name: "",
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
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      toast.success("Document removed successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete document");
    }
  };

  // Renew document (add 1 year)
  const handleRenew = async (id: string) => {
    try {
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
      toast.success("Document renewed for 1 year", { id: "renew-doc" });
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
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800";
      case "expiring":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800";
      case "expired":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border-rose-200 dark:border-rose-800";
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
        {badge.text}
        {doc.ai_confidence_score &&
          `: ${Math.round(doc.ai_confidence_score * 100)}%`}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-10 w-10 animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold">
                AI Document Manager
              </h1>
            </div>
            <p className="text-blue-100 text-lg md:text-xl max-w-3xl">
              Automatically extract expiry dates and details with AI-powered
              analysis. Upload once, never miss an expiration again.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All uploads</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.aiProcessed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-extracted
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                {stats.expiring}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Within 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-rose-600 dark:text-rose-400">
                {stats.expired}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Action required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Area */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105"
                  : "border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-950/10 hover:border-purple-400 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Upload
                  className={`h-16 w-16 text-gray-400 transition-transform ${
                    isDragging ? "scale-110" : ""
                  }`}
                />
                <Sparkles className="h-10 w-10 text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AI-Powered Upload</h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Drop files here or click to upload. AI will automatically
                extract expiry dates, document numbers, and other details.
              </p>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Choose Files
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="h-6 w-6 text-purple-500" />
                      Upload New Document
                    </DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-6 py-4">
                    {/* File Input */}
                    <div className="grid gap-3">
                      <Label htmlFor="file" className="text-base font-semibold">
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
                        className="cursor-pointer"
                      />
                      {uploadForm.file && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {uploadForm.file.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
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
                        className="h-5 w-5 rounded border-purple-300"
                      />
                      <Label
                        htmlFor="useAI"
                        className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                      >
                        <Brain className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="font-semibold">Use AI Extraction</div>
                          <div className="text-xs text-muted-foreground">
                            Automatically extract document details using Claude
                            AI
                          </div>
                        </div>
                      </Label>
                    </div>

                    {/* Extraction Status */}
                    {isExtracting && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 animate-pulse">
                        <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                        <div>
                          <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                            AI is analyzing your document...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            This may take a few seconds
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Extraction Success */}
                    {extractedData && !isExtracting && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                            AI Extraction Completed!
                          </span>
                          <Badge variant="secondary" className="ml-auto">
                            {Math.round((extractedData.confidence || 0) * 100)}%
                            confidence
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Review and edit the extracted information below
                        </p>
                      </div>
                    )}

                    {/* Extraction Error */}
                    {extractionError && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-rose-500" />
                          <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                            AI Extraction Failed
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {extractionError}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please fill in the details manually below
                        </p>
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="doc-name"
                          className="text-sm font-semibold"
                        >
                          Document Name *
                        </Label>
                        <Input
                          id="doc-name"
                          placeholder="e.g. Passport"
                          value={uploadForm.name}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="doc-category"
                          className="text-sm font-semibold"
                        >
                          Category *
                        </Label>
                        <Select
                          value={uploadForm.category}
                          onValueChange={(val) =>
                            setUploadForm({ ...uploadForm, category: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identity">🪪 Identity</SelectItem>
                            <SelectItem value="insurance">
                              🛡️ Insurance
                            </SelectItem>
                            <SelectItem value="license">📜 License</SelectItem>
                            <SelectItem value="contract">
                              📄 Contract
                            </SelectItem>
                            <SelectItem value="other">📁 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="expiry-date"
                          className="text-sm font-semibold"
                        >
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
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="doc-number"
                          className="text-sm font-semibold"
                        >
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
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="issue-date"
                          className="text-sm font-semibold"
                        >
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
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label
                          htmlFor="issuing-auth"
                          className="text-sm font-semibold"
                        >
                          Issuing Authority
                        </Label>
                        <Input
                          id="issuing-auth"
                          placeholder="e.g. Government of USA"
                          value={uploadForm.issuingAuthority}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              issuingAuthority: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || isExtracting || !uploadForm.file}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader className="mr-2 h-5 w-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl">Your Documents</CardTitle>
                <CardDescription>
                  Manage and track your important documents with AI insights
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[140px]">
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  No documents found
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || filterCategory !== "all"
                    ? "Try adjusting your filters"
                    : "Upload your first document to get started"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-4xl font-bold shadow-md">
                          {getCategoryIcon(doc.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-lg truncate">
                              {doc.name}
                            </h4>
                            {getStatusIcon(doc.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {doc.expiry_date && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span className="font-medium">
                                    {new Date(
                                      doc.expiry_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-semibold">
                                  {daysUntilExpiry(doc.expiry_date) > 0 ? (
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {daysUntilExpiry(doc.expiry_date)} days
                                      left
                                    </span>
                                  ) : (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      Expired{" "}
                                      {Math.abs(
                                        daysUntilExpiry(doc.expiry_date)
                                      )}{" "}
                                      days ago
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
                            <div className="mt-2 text-xs text-muted-foreground">
                              <Info className="inline h-3 w-3 mr-1" />
                              {doc.document_number}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(
                            doc.status
                          )} border capitalize font-semibold`}
                        >
                          {doc.status}
                        </Badge>

                        {getExtractionBadge(doc)}

                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url)}
                            className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRenew(doc.id)}
                            className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            title="Renew (Add 1 year)"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(doc.id)}
                            className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
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
    </div>
  );
}
