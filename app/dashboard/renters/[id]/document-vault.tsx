"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

type Document = {
    id: string;
    title: string;
    url: string;
    createdAt: string;
};

export function DocumentVault({ renterId, initialDocuments }: { renterId: string, initialDocuments: Document[] }) {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleUploadSuccess = async (result: any) => {
        try {
            const url = result.info.secure_url;
            const title = result.info.original_filename || "Uploaded Document";

            const res = await fetch(`/api/renters/${renterId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, title }),
            });

            if (!res.ok) throw new Error("Failed to save document");

            const newDoc = await res.json();
            setDocuments(prev => [newDoc, ...prev]);
            toast.success("Document uploaded successfully");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error saving document details");
        }
    };

    const handleDelete = async (docId: string) => {
        setIsDeleting(docId);
        try {
            const res = await fetch(`/api/renters/${renterId}/documents/${docId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete document");

            setDocuments(prev => prev.filter(d => d.id !== docId));
            toast.success("Document deleted");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete document");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <CldUploadWidget
                uploadPreset="ml_default" // The unsigned upload preset defined in your Cloudinary account
                onSuccess={handleUploadSuccess}
                options={{
                    sources: ['local', 'camera', 'google_drive'],
                    multiple: false,
                    maxFiles: 1,
                }}
            >
                {({ open }) => {
                    return (
                        <div
                            onClick={() => open()}
                            className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="bg-primary/10 p-3 rounded-full mb-3">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <p className="font-medium text-sm">Click to upload documents</p>
                            <p className="text-xs text-muted-foreground mt-1">Identity proof, lease agreements (PDF/Images)</p>
                        </div>
                    );
                }}
            </CldUploadWidget>

            <div className="space-y-4">
                {documents.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Vault is empty.</p>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-muted p-2 rounded shrink-0">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="truncate">
                                    <p className="font-medium text-sm truncate">{doc.title}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(doc.createdAt), "MMM d, yyyy")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={doc.url} target="_blank" rel="noreferrer">View</a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={isDeleting === doc.id}
                                >
                                    {isDeleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
