'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError('邮箱或密码错误'); return; }
    router.push('/dashboard');
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>客户成功工作台</h1>
        <p>天润融通 · 客户成功管理平台</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="fg">
          <label>邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" required />
        </div>
        <div className="fg">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
        </div>
        <button className="btn btn-pri" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 登录中...</> : '登录'}
        </button>
        <div className="auth-link">还没有账号？<Link href="/register">立即注册</Link></div>
      </form>
    </div>
  );
}
