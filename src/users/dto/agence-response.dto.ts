export class AgencyResponseDto {
  id: string;
  name: string;
  code: string;
  country?: string;
  city?: string;
  isActive: boolean;
  createdAt: Date;
}
