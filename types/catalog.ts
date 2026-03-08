export type CatalogCategory = {
  id: string;
  nome: string;
  imagem?: string | null;
};

export type CatalogProduct = {
  id: string;
  nome: string;
  imagem: string | null;
  categoria: string;
  tamanhosDisponiveis: string[];
};

export type CatalogSnapshot = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
};
