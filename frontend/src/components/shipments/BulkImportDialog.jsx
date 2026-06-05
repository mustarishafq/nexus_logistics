import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkImportDialog({ open, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const text = await f.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1, 6).map(l => l.split(',').map(c => c.trim().replace(/"/g, '')));
    setPreview({ headers, rows, totalRows: lines.length - 1 });
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    await api.integrations.Core.UploadFile({ file });

    const extracted = await api.integrations.Core.ExtractDataFromUploadedFile({});

    if (extracted.status === 'error') {
      setResult({ success: 0, failed: 1, error: extracted.details });
      setImporting(false);
      return;
    }

    const records = Array.isArray(extracted.output) ? extracted.output : [extracted.output];
    let success = 0;

    const batches = [];
    for (let i = 0; i < records.length; i += 50) {
      batches.push(records.slice(i, i + 50));
    }

    for (const batch of batches) {
      const cleaned = batch.map(r => ({
        ...r,
        current_status: r.current_status || 'pending',
        source_system: r.source_system || 'Bulk Import',
      }));
      await api.entities.Shipment.bulkCreate(cleaned);
      success += cleaned.length;
    }

    await api.entities.WebhookLog.create({
      request_time: new Date().toISOString(),
      event_type: 'bulk_import',
      source_system: 'Bulk Import',
      processing_status: 'completed',
      records_processed: success,
      payload_summary: `Imported ${success} shipments from ${file.name}`,
    });

    setResult({ success, failed: 0 });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
    toast.success(`Imported ${success} shipments`);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bulk Import Shipments</DialogTitle></DialogHeader>

        {!file && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Click to upload CSV file</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv format</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {file && preview && !result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{preview.totalRows} rows detected</p>
              </div>
            </div>
            <Card className="p-3 overflow-x-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first 5 rows)</p>
              <table className="text-xs w-full">
                <thead>
                  <tr>{preview.headers.map(h => <th key={h} className="text-left p-1 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>{row.map((c, j) => <td key={j} className="p-1 text-muted-foreground">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {result && (
          <div className="text-center py-4">
            {result.error ? (
              <>
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium text-destructive">Import Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-10 h-10 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">Import Complete</p>
                <p className="text-xs text-muted-foreground mt-1">{result.success} shipments imported</p>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {file && !result && (
            <Button onClick={handleImport} disabled={importing} className="gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import'}
            </Button>
          )}
          {result && <Button onClick={() => { onClose(); reset(); }}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
