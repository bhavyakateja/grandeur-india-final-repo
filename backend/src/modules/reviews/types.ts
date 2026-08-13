export interface ReviewResponse {
  id: string;

  rating: number;

  title: string | null;

  comment: string | null;

  createdAt: Date;

  user: {
    id: string;
    name: string;
  };

  images: {
    id: string;
    url: string;
  }[];
}