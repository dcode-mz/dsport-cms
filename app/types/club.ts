export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  shortName: string;
  foundingDate: { name: string };
  website: { name: string };
  _count: { teams: number };
}