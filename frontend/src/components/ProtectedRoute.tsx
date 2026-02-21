import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({children}:ProtectedRouteProps) {
  // const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const location = useLocation();

  const [isAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('store_authenticated') === 'true';
  });

  // useEffect(() => {
  //   const authStatus = sessionStorage.getItem('store_authenticated') === 'true'
  //   setIsAuthenticated(authStatus);
  // }, []);

  // if (isAuthenticated === null) {
  //   return <div>読み込み中...</div>
  // }
  
  if (!isAuthenticated) {
    return (
      <Navigate
      to="/store-login"
      replace
      state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
