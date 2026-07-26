"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode } from "@/lib/types";

const ObsidianGraphView = dynamic(
  () => import("@/components/graph/ObsidianGraphView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#030014] flex items-center justify-center text-gray-400">
        Loading Cosmos...
      </div>
    ),
  }
);

export default function ExploreClient({ data }: { data: GraphData }) {
  const router = useRouter();

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === "note" && node.slug) {
      router.push(`/notes/${node.slug}`);
    } else if (node.type === "topic" && node.slug) {
      router.push(`/topics/${node.slug}`);
    }
  };

  return (
    <ObsidianGraphView data={data} onNodeClick={handleNodeClick} />
  );
}
