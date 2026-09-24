import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 mx-auto flex items-center justify-center">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Record or Page Not Found</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The resource you requested does not exist or you do not have permission to view it.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link href="/dashboard">
            <Button size="sm" className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Console
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
