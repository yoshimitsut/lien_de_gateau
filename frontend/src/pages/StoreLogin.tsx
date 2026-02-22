import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StoreLogin.css';

export default function StoreLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // 🧩 Lista de senhas válidas
  const VALID_PASSWORDS = ['0318', 't123'];

  const handleLogin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (VALID_PASSWORDS.includes(password)) {
      sessionStorage.setItem('store_authenticated', 'true');
      
      // 🔥 CORREÇÃO: Obter a rota original do state
      const from = location.state?.from?.pathname || '/list';
      console.log('Redirecionando para:', from); // Para debug
      
      navigate(from, { replace: true });
    } else {
      setError('パスワードが正しくありません');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>店舗管理画面</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="password">パスワード:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}