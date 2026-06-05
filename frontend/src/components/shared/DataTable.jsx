import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

export default function DataTable({ columns, data, searchable = true, exportable = true, pageSize = 15, onRowClick }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col.key] || '').toLowerCase().includes(s))
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const exportCSV = () => {
    const header = columns.map(c => c.label).join(',');
    const rows = sorted.map(row => columns.map(c => `"${row[c.key] ?? ''}"`).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {exportable && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{sorted.length} records</span>
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer hover:bg-muted transition-colors text-xs font-semibold uppercase tracking-wider"
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">No data found</TableCell></TableRow>
            ) : (
              paged.map((row, i) => (
                <TableRow key={row.id || i} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <TableCell key={col.key} className="text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}