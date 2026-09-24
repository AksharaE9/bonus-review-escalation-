import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { reviewRepo } from "@/server/repos/review.repo";
import { ReviewsClient } from "./ReviewsClient";

interface ReviewsPageProps {
  searchParams: Promise<{
    status?: string;
    reviewType?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as unknown as SessionUser;
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const reviewsData = await reviewRepo.list(user, {
    status: params.status,
    reviewType: params.reviewType,
    search: params.search,
    page,
    pageSize: 25,
  });

  return (
    <ReviewsClient
      user={user}
      reviewsData={reviewsData}
      filters={{
        status: params.status || "",
        reviewType: params.reviewType || "",
        search: params.search || "",
      }}
    />
  );
}
