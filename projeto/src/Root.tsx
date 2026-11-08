// Uma <Composition> por vídeo. Para um vídeo novo: copie src/exemplo/ para src/<nome>/ e registre aqui.
import React from "react";
import { Composition, Still } from "remotion";
import { Exemplo, EXEMPLO_FRAMES } from "./exemplo/Exemplo";
import { Miniatura, MiniaturaProps } from "./kit/Miniatura";

export const Root: React.FC = () => (
  <>
    {/* vertical 9:16 (Shorts / Reels / TikTok). Para 16:9 use width 1920 height 1080. */}
    <Composition id="Exemplo" component={Exemplo} durationInFrames={EXEMPLO_FRAMES} fps={30} width={1080} height={1920} />
    <Still id="Miniatura" component={Miniatura} width={1280} height={720}
      defaultProps={{ imagem: "exemplo/quadro.jpg", texto: ["E SE A LUA", "SUMISSE?"], selo: "E SE?" } satisfies MiniaturaProps} />
  </>
);
