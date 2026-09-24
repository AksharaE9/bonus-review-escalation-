"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/EmptyState";
import { restoreRecordAction } from "@/server/actions/user";
import { formatDateTime } from "@/lib/dates";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  Users,
  IndianRupee,
  FileCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";

interface DeletedItem {
  id: string;
  label: string;
  sublabel: string | null;
  deletedAt: string;
}

interface RecycleBinClientProps {
  user?: SessionUser;
  users: DeletedItem[];
  bonuses: DeletedItem[];
  reviews: DeletedItem[];
  escalations: DeletedItem[];
}

export function RecycleBinClient({
  users,
  bonuses,
  reviews,
  escalations,
}: RecycleBinClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRestore = (entityType: "users" | "bonuses" | "reviews" | "escalations", id: string) => {
    startTransition(async () => {
      try {
        await restoreRecordAction(entityType, id);
        toast.success(`Restored ${entityType} record successfully.`);
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message || "Failed to restore record");
      }
    });
  };

  const renderTable = (items: DeletedItem[], type: "users" | "bonuses" | "reviews" | "escalations") => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={Trash2}
          title="Recycle bin is clean"
          description={`No soft-deleted ${type} found.`}
        />
      );
    }

    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Item
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Details
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Deleted Date
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
                <TableCell className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </TableCell>
                <TableCell className="text-xs text-zinc-500 font-mono">
                  {item.sublabel || "—"}
                </TableCell>
                <TableCell className="text-xs font-mono text-zinc-500">
                  {formatDateTime(item.deletedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                    onClick={() => handleRestore(type, item.id)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Restore Record
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Soft-Delete Recycle Bin"
        description="Review and restore soft-deleted records across employees, bonuses, reviews, and escalations. Every restoration is audited."
        actions={
          <Link href="/settings">
            <Button variant="outline" size="sm" className="text-xs h-8">
              Back to Settings
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger value="users" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="text-xs gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" />
            Bonuses ({bonuses.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs gap-1.5">
            <FileCheck className="w-3.5 h-3.5" />
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="escalations" className="text-xs gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Escalations ({escalations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">{renderTable(users, "users")}</TabsContent>
        <TabsContent value="bonuses">{renderTable(bonuses, "bonuses")}</TabsContent>
        <TabsContent value="reviews">{renderTable(reviews, "reviews")}</TabsContent>
        <TabsContent value="escalations">{renderTable(escalations, "escalations")}</TabsContent>
      </Tabs>
    </div>
  );
}
