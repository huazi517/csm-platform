'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || '注册失败'); return; }
    router.push('/login');
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>注册账号</h1>
        <p>加入客户成功管理平台</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="fg">
          <label>姓名</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="您的姓名" required />
        </div>
        <div className="fg">
          <label>邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="工作邮箱" required />
        </div>
        <div className="fg">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6位密码" required />
        </div>
        <button className="btn btn-pri" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> 注册中...</> : '注册'}
        </button>
        <div className="auth-link">已有账号？<Link href="/login">立即登录</Link></div>
      </form>
    </div>
  );
}
