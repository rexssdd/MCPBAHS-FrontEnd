import { createContext } from "react";

export const AuthContext = createContext({
  auth: null,
  setAuth: () => {},
  login: () => {},
  logout: () => {},
});