import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { bonuses } from "@/db/schema/bonuses";
import { reviews } from "@/db/schema/reviews";
import { escalations } from "@/db/schema/escalations";
import { isNotNull, desc } from "drizzle-orm";
import { RecycleBinClient } from "./RecycleBinClient";

export default async function RecycleBinPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const deletedUsers = await db
    .select({
      id: users.id,
      label: users.fullName,
      sublabel: users.email,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(isNotNull(users.deletedAt))
    .orderBy(desc(users.deletedAt));

  const deletedBonuses = await db
    .select({
      id: bonuses.id,
      label: bonuses.reason,
      sublabel: bonuses.amount,
      deletedAt: bonuses.deletedAt,
    })
    .from(bonuses)
    .where(isNotNull(bonuses.deletedAt))
    .orderBy(desc(bonuses.deletedAt));

  const deletedReviews = await db
    .select({
      id: reviews.id,
      label: reviews.summary,
      sublabel: reviews.reviewType,
      deletedAt: reviews.deletedAt,
    })
    .from(reviews)
    .where(isNotNull(reviews.deletedAt))
    .orderBy(desc(reviews.deletedAt));

  const deletedEscalations = await db
    .select({
      id: escalations.id,
      label: escalations.title,
      sublabel: escalations.refCode,
      deletedAt: escalations.deletedAt,
    })
    .from(escalations)
    .where(isNotNull(escalations.deletedAt))
    .orderBy(desc(escalations.deletedAt));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      <RecycleBinClient
        user={user}
        users={deletedUsers.map((u) => ({ ...u, deletedAt: new Date(u.deletedAt!).toISOString() }))}
        bonuses={deletedBonuses.map((b) => ({ ...b, deletedAt: new Date(b.deletedAt!).toISOString() }))}
        reviews={deletedReviews.map((r) => ({ ...r, deletedAt: new Date(r.deletedAt!).toISOString() }))}
        escalations={deletedEscalations.map((e) => ({ ...e, deletedAt: new Date(e.deletedAt!).toISOString() }))}
      />
    </div>
  );
}
