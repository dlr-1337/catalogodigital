export type FacilzapApiListResponse<T> = {
  data?: T[];
  [key: string]: unknown;
};

export type FacilzapImageRaw =
  | string
  | {
      url?: unknown;
      imagem?: unknown;
      src?: unknown;
      principal?: unknown;
      destaque?: unknown;
      variacoes?: unknown;
      [key: string]: unknown;
    };

export type FacilzapCategoryRaw = {
  id?: unknown;
  nome?: unknown;
  superior?: unknown;
  ordem?: unknown;
  status?: unknown;
  imagem?: unknown;
  [key: string]: unknown;
};

export type FacilzapVariationGroupRaw = {
  id?: unknown;
  nome?: unknown;
  ordem?: unknown;
  variacoes?: unknown;
  [key: string]: unknown;
};

export type FacilzapStockRaw =
  | number
  | string
  | {
      controlar_estoque?: unknown;
      controla_estoque?: unknown;
      estoque?: unknown;
      quantidade?: unknown;
      saldo?: unknown;
      total?: unknown;
      estoque_minimo?: unknown;
      localizacao?: unknown;
      [key: string]: unknown;
    };

export type FacilzapVariationRaw = {
  id?: unknown;
  grupo?: unknown;
  subgrupo?: unknown;
  nome?: unknown;
  cor?: unknown;
  ordem?: unknown;
  status?: unknown;
  total_produtos?: unknown;
  estoque?: FacilzapStockRaw;
  [key: string]: unknown;
};

export type FacilzapVariationReferenceRaw =
  | string
  | {
      id?: unknown;
      variacao_id?: unknown;
      variacaoId?: unknown;
      nome?: unknown;
      grupo?: unknown;
      status?: unknown;
      ativado?: unknown;
      ativada?: unknown;
      ativo?: unknown;
      estoque?: FacilzapStockRaw;
      quantidade?: unknown;
      [key: string]: unknown;
    };

export type FacilzapProductRaw = {
  id?: unknown;
  nome?: unknown;
  descricao?: unknown;
  ativado?: unknown;
  ativo?: unknown;
  status?: unknown;
  imagem?: unknown;
  imagens?: unknown;
  categoria_nome?: unknown;
  categorias?: unknown;
  variacoes?: FacilzapVariationReferenceRaw[] | string | null;
  estoque?: FacilzapStockRaw;
  [key: string]: unknown;
};
