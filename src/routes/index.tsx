import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Phaser Platformer" },
      { name: "description", content: "Jogo de plataforma em Phaser: ande, corra e pule." },
      { property: "og:title", content: "Phaser Platformer" },
      { property: "og:description", content: "Jogo de plataforma em Phaser: ande, corra e pule." },
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
