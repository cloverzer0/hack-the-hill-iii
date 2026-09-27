import { SpendingFeedScreen } from "@/components/SpendingStoryScreens";

export default async function Page({ searchParams }: { searchParams: Promise<{ department?: string }> }) {
  const params = await searchParams;
  return <SpendingFeedScreen department={params.department} />;
}
