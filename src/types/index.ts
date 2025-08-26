export interface User {
  id: string;
  role_id: string | null;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Role {
  id: string;
  role_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserRight {
  id: string;
  right_name: string;
  description: string;
  created_at: string;
}

export interface DatabaseEngine {
  id: string;
  engine_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  category_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  tag_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Query {
  id: string;
  query_name: string;
  engine_id: string | null;
  category_id: string | null;
  tag_id: string | null;
  query_text: string;
  description: string;
  is_shared: boolean;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  engine?: DatabaseEngine;
  category?: Category;
  tag?: Tag;
  creator?: User;
}

export interface AuthUser {
  user: User;
  role: Role | null;
  rights: UserRight[];
}