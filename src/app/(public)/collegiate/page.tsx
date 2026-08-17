import { notFound } from "next/navigation";

import { CollegiateHome } from "@/components/collegiate/collegiate-home";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

export default async function CollegiatePage() {
  const chapter = await getCurrentChapter();

  if (chapter.siteType !== "collegiate") notFound();

  return <CollegiateHome chapter={chapter} />;
}
