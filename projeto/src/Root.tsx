import React from "react";
import { Composition, Still } from "remotion";
import { Exemplo, EXEMPLO_FRAMES } from "./exemplo/Exemplo";
import { Miniatura, MiniaturaProps } from "./kit/Miniatura";
import { ProjetoExemplo, PROJETO_EXEMPLO, PROJETO_EXEMPLO_FRAMES } from "./project/ProjetoExemplo";

export const Root: React.FC = () => (
  <>
    <Composition
      id="ProjetoExemplo"
      component={ProjetoExemplo}
      durationInFrames={PROJETO_EXEMPLO_FRAMES}
      fps={PROJETO_EXEMPLO.profile.fps}
      width={PROJETO_EXEMPLO.profile.width}
      height={PROJETO_EXEMPLO.profile.height}
    />
    <Composition id="Exemplo" component={Exemplo} durationInFrames={EXEMPLO_FRAMES} fps={30} width={1080} height={1920} />
    <Still id="Miniatura" component={Miniatura} width={1280} height={720}
      defaultProps={{ imagem: "exemplo/quadro.jpg", texto: ["E SE A LUA", "SUMISSE?"], selo: "E SE?" } satisfies MiniaturaProps} />
  </>
);
