import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  searchable = true,
  exportable = true,
  pageSize = 15,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  rowIdKey = 'id',
  toolbarStart = null,
}) {
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

  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
  const pageIds = useMemo(() => paged.map(row => String(row[rowIdKey])).filter(Boolean), [paged, rowIdKey]);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedSet.has(id));
  const somePageSelected = pageIds.some(id => selectedSet.has(id));

  const toggleRowSelection = (rowId, checked) => {
    if (!onSelectedIdsChange) return;
    const id = String(rowId);
    if (checked) {
      onSelectedIdsChange([...selectedIds.map(String), id].filter((value, index, arr) => arr.indexOf(value) === index));
    } else {
      onSelectedIdsChange(selectedIds.map(String).filter(value => value !== id));
    }
  };

  const togglePageSelection = (checked) => {
    if (!onSelectedIdsChange) return;
    if (checked) {
      const merged = new Set([...selectedIds.map(String), ...pageIds]);
      onSelectedIdsChange([...merged]);
    } else {
      const pageIdSet = new Set(pageIds);
      onSelectedIdsChange(selectedIds.map(String).filter(id => !pageIdSet.has(id)));
    }
  };

  const exportColumns = columns.filter(col => col.exportable !== false && !['select', 'actions'].includes(col.key));

  const exportCSV = () => {
    const header = exportColumns.map(c => c.label).join(',');
    const rows = sorted.map(row => exportColumns.map(c => `"${row[c.key] ?? ''}"`).join(','));
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
      <div className="flex items-center gap-4">
        {searchable ? (
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
          </div>
        ) : toolbarStart}
        <div className="flex items-center gap-2 ml-auto">
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
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                    onCheckedChange={togglePageSelection}
                    aria-label="Select all on page"
                  />
                </TableHead>
              )}
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  className={`${col.sortable !== false ? 'cursor-pointer hover:bg-muted' : ''} transition-colors text-xs font-semibold uppercase tracking-wider`}
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
              <TableRow><TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="text-center text-muted-foreground py-8">No data found</TableCell></TableRow>
            ) : (
              paged.map((row, i) => {
                const rowId = String(row[rowIdKey] ?? '');
                const isSelected = selectedSet.has(rowId);

                return (
                <TableRow key={row.id || i} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onRowClick?.(row)} data-state={isSelected ? 'selected' : undefined}>
                  {selectable && (
                    <TableCell className="w-10" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked => toggleRowSelection(rowId, checked === true)}
                        aria-label={`Select order ${row.order_number || rowId}`}
                      />
                    </TableCell>
                  )}
                  {columns.map(col => (
                    <TableCell key={col.key} className="text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
                );
              })
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