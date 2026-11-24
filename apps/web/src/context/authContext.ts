 import { createContext } from "react";
import type {
  User,
  LoginInput,
} from "../services/authApi";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (values: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);