import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ちむソリティア",
    short_name: "ちむソリ",
    description: "クラシックなクロンダイク・ソリティア",
    start_url: "/",
    display: "standalone",
    background_color: "#0a3d2e",
    theme_color: "#0f5132",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
