"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function QBOTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "deadline", desc: false }, // Default sort by deadline ascending
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  // Calculate total points
  const totalPoints = data.reduce((sum, item: any) => sum + (item.points || 0), 0);
  
  // Calculate average progress
  const averageProgress = data.length > 0 
    ? (data.reduce((sum, item: any) => {
        const beginValue = item.beginningValue || 0;
        const currentValue = item.currentValue || 0;
        const targetValue = item.targetValue || 1;
        let progress = 0;
        if (targetValue !== beginValue) {
          progress = ((currentValue - beginValue) / (targetValue - beginValue)) * 100;
        }
        return sum + progress;
      }, 0) / data.length).toFixed(2) + '%'
    : '0%';

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id}
                    className="font-semibold"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No QBOs found.
              </TableCell>
            </TableRow>
          )}
          
          {/* Summary row with properly aligned columns */}
          <TableRow className="bg-gray-50">
            {/* First 6 cells empty (name, unit, beginning, current, target, deadline) */}
            <TableCell colSpan={6} className="text-right font-medium">
              SUM
            </TableCell>
            
            {/* Points sum */}
            <TableCell className="font-medium">
              {totalPoints}
            </TableCell>
            
            {/* Notes - empty */}
            <TableCell></TableCell>
            
            {/* Current progress average */}
            <TableCell className="font-medium">
              {averageProgress}
            </TableCell>
            
            {/* Expected progress average */}
            <TableCell className="font-medium">
              0.00%
            </TableCell>
            
            {/* Actions column - empty */}
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}