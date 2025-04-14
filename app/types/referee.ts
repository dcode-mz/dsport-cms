export interface Referee {
  id: string;
  name: string;
  dateOfBirth?: Date;
  nationality: {
    name: string;
    logo: string;
  };
}
