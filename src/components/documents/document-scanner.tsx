"use client";

import type React from "react";

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
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

type Document = {
  id: string;
  name: string;
  type: string;
  expiryDate: string;
  status: "valid" | "expiring" | "expired";
  uploadDate: string;
  category: "identity" | "insurance" | "license" | "contract" | "other";
};

const initialDocuments: Document[] = [
  {
    id: "1",
    name: "Passport",
    type: "PDF",
    expiryDate: "2024-04-15",
    status: "expiring",
    uploadDate: "2023-01-10",
    category: "identity",
  },
  {
    id: "2",
    name: "Driver's License",
    type: "PDF",
    expiryDate: "2026-08-20",
    status: "valid",
    uploadDate: "2023-02-15",
    category: "license",
  },
  {
    id: "3",
    name: "Car Insurance",
    type: "PDF",
    expiryDate: "2024-05-01",
    status: "expiring",
    uploadDate: "2023-05-01",
    category: "insurance",
  },
  {
    id: "4",
    name: "Health Insurance",
    type: "PDF",
    expiryDate: "2024-12-31",
    status: "valid",
    uploadDate: "2024-01-01",
    category: "insurance",
  },
  {
    id: "5",
    name: "Lease Agreement",
    type: "PDF",
    expiryDate: "2024-03-01",
    status: "expired",
    uploadDate: "2023-03-01",
    category: "contract",
  },
];

export function DocumentScanner() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "valid":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "expiring":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "expired":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    }
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "valid":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "expiring":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
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

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleRenew = (id: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status: "valid" as const,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            }
          : doc
      )
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    console.log("[v0] Files dropped:", e.dataTransfer.files);
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
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.expiring}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.expired}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="doc-name">Document Name</Label>
                    <Input id="doc-name" placeholder="e.g. Passport" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc-category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="identity">Identity</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                  <Button onClick={() => setIsUploadOpen(false)}>
                    Upload Document
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>
                Manage and track your important documents
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
              <Select value={filterCategory} onValueChange={setFilterCategory}>
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
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                    onClick={() =>
                      console.log("[v0] Document clicked:", doc.name)
                    }
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{doc.name}</h4>
                          {getStatusIcon(doc.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expires:{" "}
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="capitalize">{doc.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(doc.status)}
                      >
                        {doc.status.charAt(0).toUpperCase() +
                          doc.status.slice(1)}
                      </Badge>

                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenew(doc.id);
                          }}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
