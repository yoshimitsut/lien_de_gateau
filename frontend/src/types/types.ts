export type Newsletter = {
  id?: number;
  title: string;
  content?: string;
  source: "site" | "instagram";
  link?: string;
  updated_at: string;
}