import { useAuthContext } from '../context/AuthContext';

// Simple re-export hook so components can import from hooks/useAuth
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
