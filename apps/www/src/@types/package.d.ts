type Package = {
  price: number;
  name: string;
  id: number;
  tcg_id?: string;
  image_url: string;
  cards_quantity?: number;
};

type UserPackage = {
  name: string;
  image_url: string;
  id: number;
  tcg_id?: string;
  description: string;
  quantity: number;
  cards_quantity?: number;
};
