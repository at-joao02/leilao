export interface ArtistInfo {
  name: string;
  /** Caminho da fotografia (colocar o ficheiro em frontend/public/artists/) */
  photo: string;
  bio: string;
}

/**
 * Informação dos artistas mostrada na modal "Sobre o Artista".
 * Edite aqui as biografias e fotografias.
 * A chave deve ser exactamente igual ao campo `artist` da obra.
 */
export const ARTISTS: Record<string, ArtistInfo> = {
  'Thó Simões': {
    name: 'Thó Simões',
    photo: 'artists/tho-simoes.jpg',
    bio: 'Artista plástico angolano cuja obra retrata a natureza, a vida urbana e a identidade '
       + 'de Angola. Doou as suas obras ao Leilão Solidário do 5º aniversário da Associação PDPT, '
       + 'apoiando a educação e o civismo da juventude angolana.',
  },
  'Cadjengue': {
    name: 'Cadjengue',
    photo: 'artists/cadjengue.jpg',
    bio: 'Artista angolano com um percurso dedicado à fotografia e à pintura, captando a alma '
       + 'das gentes e paisagens de Angola. Participa no Leilão Solidário da Associação PDPT '
       + 'com obras doadas em prol da educação dos jovens angolanos.',
  },
};

/** Texto padrão para artistas sem entrada na lista acima. */
export const DEFAULT_BIO =
  'Artista angolano que doou a sua obra ao Leilão Solidário da Associação PDPT, '
  + 'contribuindo para apoiar jovens angolanos no seu percurso académico e cívico.';
