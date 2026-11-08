# Origem dos modelos 3D prontos

Cada arquivo `.js` desta pasta é um pacote de modelos prontos que o motor carrega sozinho (o render e o
`npm run cenarios` leem todo `motor/modelos/*.js`). Na cena: `K.modelo('<pacote>/<peça>', { escala, pos, giro })`; a lista
de peças fica em `K.MODELOS`. Os arquivos são gerados a partir dos modelos originais (`.glb`), com a cor de cada vértice
já assada: não editar à mão. Modelo novo só entra com a licença conferida e anotada aqui.

## kenney-cidade.js (Kenney, CC0)

Do repositório oficial `KenneyNL/Starter-Kit-City-Builder` no GitHub, commit `4535092b740b378b700efd9df9e27a631815b84a`
(2026-03-12), pasta `models/`. O README de lá diz: "Assets included in this package (2D sprites, 3D models and sound
effects) are CC0 licensed". CC0 é domínio público: pode usar, mudar e vender o vídeo, sem precisar dar crédito (dar
crédito ao Kenney, kenney.nl, é uma gentileza).

Cada peça ocupa um quadrado de 1 x 1 no chão (escala 5 ou 6 deixa a casa do tamanho certo perto do personagem).

| Peça | O que é |
|---|---|
| building-small-a, -b, -c, -d | casinhas e sobrados |
| building-garage | garagem |
| grass, grass-trees, grass-trees-tall | lote de grama, com árvores baixas ou altas |
| pavement, pavement-fountain | calçada e praça com chafariz |
| road-straight, road-straight-lightposts | rua reta, sem e com poste |
| road-corner, road-split, road-intersection | esquina, rua em T e cruzamento |
