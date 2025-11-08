import { UserRole } from '../enums/user.enum';

export class PayloadDto {
  _id: string;
  role: UserRole;
}
