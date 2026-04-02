export interface AmsUser {
  pk: number;
  userName: string;
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  merchantCodes?: string;
  status?: string;
  lastAccessTime?: string;
}

export interface AmsUserPage {
  content: AmsUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
