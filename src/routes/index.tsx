import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetheria — Treino de Ki" },
      { name: "description", content: "Treino de plataforma com tiros de ki, Super Sayajin e Kaioken." },
      { property: "og:title", content: "Aetheria — Treino de Ki" },
      { property: "og:description", content: "Treino de plataforma com tiros de ki, Super Sayajin e Kaioken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let game: { destroy: (b: boolean) => void } | undefined;
    let cancelled = false;
    import("../game/startGame").then(({ startGame }) => {
      if (!cancelled && ref.current) game = startGame(ref.current);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);
  return <div ref={ref} className="h-screen w-screen bg-foreground" />;
}
