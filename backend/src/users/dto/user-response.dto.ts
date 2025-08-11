export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  createdAt: Date;
  
  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.avatar = user.avatar;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
