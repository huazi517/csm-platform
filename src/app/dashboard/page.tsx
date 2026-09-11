'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/components/AppContext';

// ===== Shared SVG Icons =====
const I = {
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function toast(msg: string, err?: boolean) {
  const t = document.createElement('div');
  t.className = 'toast ' + (err ? 'toast-err' : 'toast-ok');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function daysDiff(d?: string) {
  if (!d) return 999;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000);
}

function fmtDate(d?: string) { return d ? d.split('T')[0] : '-'; }

// ===== MAIN PAGE COMPONENT =====
export default function DashboardPage() {
  const { page, refreshKey, triggerRefresh } = useApp();
  switch (page) {
    case 'dashboard': return <DashboardView key={refreshKey} />;
    case 'customers': return <CustomersView key={refreshKey} onRefresh={triggerRefresh} />;
    case 'contract': return <ContractView key={refreshKey} />;
    case 'balance': return <BalanceView key={refreshKey} />;
    case 'followups': return <FollowUpsView key={refreshKey} onRefresh={triggerRefresh} />;
    default: return null;
  }
}

// ===== DASHBOARD VIEW =====
function DashboardView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dashRes, custRes, fuRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/customers?sort=contractEnd'),
        fetch('/api/followups?status=pending'),
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (custRes.ok && fuRes.ok) {
        const customers = await custRes.json();
        const followUps = await fuRes.json();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const items: any[] = [];
        customers.forEach((c: any) => {
          if (c.status === 'churned') return;
          const d = daysDiff(c.contractEnd);
          if (d <= 0) items.push({ lv: 'danger', title: c.name + ' 合同已到期', desc: '到期 ' + fmtDate(c.contractEnd), cid: c.id });
          else if (d <= 15) items.push({ lv: 'warning', title: c.name + ' 合同 ' + d + ' 天后到期', desc: '套餐：' + (c.planType || '-'), cid: c.id });
          if (c.balance < c.alertThreshold) items.push({ lv: 'warning', title: c.name + ' 余额不足', desc: '¥' + c.balance.toFixed(2) + ' / 阈值 ¥' + c.alertThreshold.toFixed(2), cid: c.id });
        });
        followUps.forEach((f: any) => {
          if (fmtDate(f.date) <= today) items.push({ lv: 'warning', title: f.customer?.name + ' - 跟进', desc: (f.type || '') + '：' + (f.note || '无'), fid: f.id });
        });
        setTodayItems(items);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Loading />;
  if (!dashboard) return <Empty text="加载失败" />;

  return (
    <>
      {todayItems.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-hd"><h2>{I.alert} 今天要处理 <span className="badge badge-danger">{todayItems.length}</span></h2></div>
          <div className="card-bd">
            {todayItems.map((it, i) => (
              <div key={i} className={`today-item ${it.lv}`}>
                <div className={`today-icon ${it.lv}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="today-content"><div className="today-title">{it.title}</div><div className="today-desc">{it.desc}</div></div>
                <span className={`btn btn-sm ${it.lv === 'danger' ? 'btn-danger' : 'btn-warn'}`}>处理</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="stats">
        <div className="st-card"><div className="st-lbl">{I.alert} 合同到期</div><div className="st-val" style={{ color: 'var(--danger)' }}>{dashboard.expiringContracts}</div><div className="st-sub">30天内到期</div></div>
        <div className="st-card"><div className="st-lbl">{I.wallet} 余额不足</div><div className="st-val" style={{ color: 'var(--warn)' }}>{dashboard.lowBalance}</div><div className="st-sub">低于阈值</div></div>
        <div className="st-card"><div className="st-lbl">{I.users} 活跃客户</div><div className="st-val" style={{ color: 'var(--ok)' }}>{dashboard.activeCustomers}</div><div className="st-sub">共 {dashboard.totalCustomers} 位</div></div>
        <div className="st-card"><div className="st-lbl">{I.calendar} 待跟进</div><div className="st-val" style={{ color: 'var(--pri)' }}>{dashboard.pendingFollowUps}</div><div className="st-sub">逾期 {dashboard.overdueFollowUps} 项</div></div>
      </div>
      <div className="card">
        <div className="card-hd"><h2>客户健康度分布</h2></div>
        <div className="card-bd">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'healthy', label: '健康', color: 'var(--ok)' },
              { key: 'attention', label: '关注', color: '#EAB308' },
              { key: 'risk', label: '风险', color: 'var(--danger)' },
              { key: 'churned', label: '流失', color: 'var(--g400)' },
            ].map(h => (
              <div key={h.key} style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: h.color }}>{dashboard.healthDistribution?.[h.key] || 0}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
                  <span className={`health-dot ${h.key}`}></span>{h.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ===== CUSTOMERS VIEW =====
function CustomersView({ onRefresh }: { onRefresh: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [fuModal, setFuModal] = useState<any>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('status', filter);
    params.set('sort', 'contractEnd');
    const res = await fetch('/api/customers?' + params.toString());
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  function toggleDetail(id: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除该客户？')) return;
    const res = await fetch('/api/customers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { toast('已删除'); load(); onRefresh(); } else toast('删除失败', true);
  }

  async function handleFuComplete(id: string) {
    await fetch('/api/followups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'done' }) });
    toast('已完成'); load(); onRefresh();
  }

  function contractBadge(c: any) {
    if (c.status === 'churned') return <span className="badge badge-muted">已流失</span>;
    const d = daysDiff(c.contractEnd);
    if (d <= 0) return <span className="badge badge-danger">已到期</span>;
    if (d <= 7) return <span className="badge badge-danger">{d}天后到期</span>;
    if (d <= 30) return <span className="badge badge-warn">{d}天后到期</span>;
    return <span className="badge badge-ok">正常</span>;
  }

  function statusBadge(s: string) {
    const m: Record<string, [string, string]> = { active: ['badge-ok', '正常'], trial: ['badge-info', '试用'], churned: ['badge-muted', '流失'] };
    const [cls, text] = m[s] || ['badge-ok', '正常'];
    return <span className={`badge ${cls}`}>{text}</span>;
  }

  if (loading) return <Loading />;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          {I.search}
          <input type="text" placeholder="搜索客户..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: '100%', padding: '8px 12px', border: '1px solid var(--g300)', borderRadius: 'var(--rs)', fontSize: 16 }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--g300)', borderRadius: 'var(--rs)', fontSize: 14 }}>
          <option value="all">全部状态</option><option value="active">正常</option>
          <option value="trial">试用</option><option value="churned">流失</option>
        </select>
        <button className="btn btn-pri" onClick={() => { setEditing(null); setModalOpen(true); }}>{I.plus} 添加客户</button>
      </div>

      {customers.length === 0 ? (
        <div className="card"><div className="card-bd empty">{I.users}<p>暂无客户数据</p></div></div>
      ) : customers.map(c => {
        const d = daysDiff(c.contractEnd);
        const cls = d <= 0 ? 'exp' : d <= 30 ? 'exp-soon' : '';
        const isExp = expanded.has(c.id);
        return (
          <div key={c.id} className={`c-card ${cls}`}>
            <div className="c-row">
              <div className="c-info">
                <div className="c-name">{c.name} {contractBadge(c)} {statusBadge(c.status)} <span className={`health-dot ${c.health || 'healthy'}`}></span></div>
                <div className="c-meta"><span>套餐：{c.planType || '-'}</span><span>联系人：{c.contact || '-'}</span><span>到期：{fmtDate(c.contractEnd)}</span></div>
              </div>
              <div className="c-bal">
                <div className="c-bal-val" style={{ color: c.balance < c.alertThreshold ? 'var(--warn)' : 'var(--g900)' }}>¥{c.balance.toFixed(2)}</div>
                <div className="c-bal-lbl">余额</div>
              </div>
            </div>
            <div className="c-acts">
              <button className="btn btn-sm btn-ghost" onClick={() => toggleDetail(c.id)}>{I.eye} 详情</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(c); setModalOpen(true); }}>{I.edit} 编辑</button>
              <button className="btn btn-sm btn-pri" onClick={() => setFuModal(c)}>{I.calendar} 跟进</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>{I.trash}</button>
            </div>
            {isExp && (
              <div className="c-detail">
                <div className="c-detail-grid">
                  <div>合同期：{fmtDate(c.contractStart)} ~ {fmtDate(c.contractEnd)}</div>
                  <div>剩余：{d <= 0 ? <span style={{ color: 'var(--danger)' }}>已过期 {Math.abs(d)} 天</span> : d + ' 天'}</div>
                  <div>邮箱：{c.email || '-'}</div>
                  <div>余额/阈值：¥{c.balance.toFixed(2)} / ¥{c.alertThreshold.toFixed(2)}</div>
                  <div>健康度：<span className={`health-dot ${c.health}`} style={{ marginRight: 4 }}></span>{c.health}</div>
                  <div>自动续约：{c.autoRenew ? '是' : '否'}</div>
                </div>
                <div style={{ marginTop: 8, color: 'var(--g500)', fontSize: 12 }}>备注：{c.notes || '无'}</div>
                {c.followUps?.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--g200)', paddingTop: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>跟进记录</div>
                    {c.followUps.map((f: any) => {
                      const overdue = f.status === 'pending' && fmtDate(f.date) < new Date().toISOString().split('T')[0];
                      return (
                        <div key={f.id} className={`fu-item ${overdue ? 'overdue' : ''}`}>
                          <span className={`fu-date ${overdue ? 'overdue' : ''}`}>{overdue ? '逾期 ' : ''}{fmtDate(f.date)}</span>
                          <span className="fu-type">{f.type}</span>
                          <span className="fu-note">{f.note || '-'}</span>
                          {f.status === 'pending' && <button className="btn btn-sm btn-ok" onClick={() => handleFuComplete(f.id)}>{I.check}</button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {modalOpen && <CustomerModal editing={editing} onClose={() => setModalOpen(false)} onSave={() => { load(); onRefresh(); toast(editing ? '更新成功' : '添加成功'); }} />}
      {fuModal && <FollowUpModal customer={fuModal} onClose={() => setFuModal(null)} onSave={() => { load(); onRefresh(); toast('跟进计划已添加'); }} />}
    </>
  );
}

// ===== CUSTOMER MODAL =====
function CustomerModal({ editing, onClose, onSave }: { editing: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState(editing || {
    name: '', contact: '', phone: '', email: '', company: '', planType: '',
    contractStart: '', contractEnd: '', balance: '0', alertThreshold: '500',
    status: 'active', notes: '', autoRenew: false,
  });
  const [loading, setLoading] = useState(false);
  const s = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/customers', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { onSave(); onClose(); } else toast('操作失败', true);
  }

  return (
    <div className="modal-ov active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd"><h3>{editing ? '编辑客户' : '添加客户'}</h3><button className="btn-icon" onClick={onClose}>{I.close}</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fr">
              <div className="fg"><label>客户名称 *</label><input required value={form.name} onChange={e => s('name', e.target.value)} /></div>
              <div className="fg"><label>公司</label><input value={form.company || ''} onChange={e => s('company', e.target.value)} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label>联系人</label><input value={form.contact || ''} onChange={e => s('contact', e.target.value)} /></div>
              <div className="fg"><label>电话</label><input type="tel" value={form.phone || ''} onChange={e => s('phone', e.target.value)} /></div>
            </div>
            <div className="fg"><label>邮箱</label><input type="email" value={form.email || ''} onChange={e => s('email', e.target.value)} /></div>
            <div className="fg"><label>套餐类型</label>
              <select value={form.planType || ''} onChange={e => s('planType', e.target.value)}>
                <option value="">请选择</option><option value="基础版">基础版</option><option value="标准版">标准版</option>
                <option value="专业版">专业版</option><option value="企业版">企业版</option>
              </select>
            </div>
            <div className="fr">
              <div className="fg"><label>合同开始</label><input type="date" value={fmtDate(form.contractStart) || ''} onChange={e => s('contractStart', e.target.value)} /></div>
              <div className="fg"><label>合同到期</label><input type="date" value={fmtDate(form.contractEnd) || ''} onChange={e => s('contractEnd', e.target.value)} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label>账户余额 (元)</label><input type="number" step="0.01" value={form.balance} onChange={e => s('balance', e.target.value)} /></div>
              <div className="fg"><label>预警阈值 (元)</label><input type="number" step="0.01" value={form.alertThreshold} onChange={e => s('alertThreshold', e.target.value)} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label>状态</label>
                <select value={form.status} onChange={e => s('status', e.target.value)}>
                  <option value="active">正常</option><option value="trial">试用</option><option value="churned">流失</option>
                </select>
              </div>
              <div className="fg"><label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                <input type="checkbox" checked={form.autoRenew || false} onChange={e => s('autoRenew', e.target.checked)} style={{ width: 'auto' }} /> 自动续约
              </label></div>
            </div>
            <div className="fg"><label>备注</label><textarea value={form.notes || ''} onChange={e => s('notes', e.target.value)} rows={2} /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-pri" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== FOLLOW-UP MODAL =====
function FollowUpModal({ customer, onClose, onSave }: { customer: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], type: '回访', note: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await fetch('/api/followups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: customer.id, ...form }) });
    setLoading(false);
    if (res.ok) { onSave(); onClose(); } else toast('添加失败', true);
  }

  return (
    <div className="modal-ov active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd"><h3>添加跟进 - {customer.name}</h3><button className="btn-icon" onClick={onClose}>{I.close}</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fr">
              <div className="fg"><label>跟进日期</label><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required /></div>
              <div className="fg"><label>跟进类型</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="回访">回访</option><option value="续约">续约</option><option value="充值">充值</option>
                  <option value="培训">培训</option><option value="投诉处理">投诉处理</option>
                </select>
              </div>
            </div>
            <div className="fg"><label>跟进内容</label><textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={3} /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-pri" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== CONTRACT VIEW =====
function ContractView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customers?sort=contractEnd').then(r => r.json()).then(data => {
      setItems(data.filter((c: any) => c.status !== 'churned' && daysDiff(c.contractEnd) <= 30).sort((a: any, b: any) => daysDiff(a.contractEnd) - daysDiff(b.contractEnd)));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="card">
      <div className="card-hd"><h2>{I.alert} 合同到期预警 <span className="badge badge-danger">{items.length}</span></h2></div>
      <div className="card-bd">
        {items.length === 0 ? <Empty text="所有合同状态正常" /> : items.map(c => {
          const d = daysDiff(c.contractEnd);
          return (
            <div key={c.id} className={`c-card ${d <= 0 ? 'exp' : 'exp-soon'}`}>
              <div className="c-row">
                <div className="c-info">
                  <div className="c-name">{c.name} {d <= 0 ? <span className="badge badge-danger">已到期</span> : <span className="badge badge-warn">{d}天后到期</span>}</div>
                  <div className="c-meta"><span>套餐：{c.planType || '-'}</span><span>联系人：{c.contact || '-'}</span><span>到期：{fmtDate(c.contractEnd)}</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== BALANCE VIEW =====
function BalanceView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customers?sort=balance').then(r => r.json()).then(data => {
      setItems(data.filter((c: any) => c.balance < c.alertThreshold && c.status !== 'churned'));
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="card">
      <div className="card-hd"><h2>{I.wallet} 余额不足预警 <span className="badge badge-warn">{items.length}</span></h2></div>
      <div className="card-bd">
        {items.length === 0 ? <Empty text="所有客户余额充足" /> : items.map(c => {
          const pct = Math.round(c.balance / c.alertThreshold * 100);
          const danger = pct < 30;
          return (
            <div key={c.id} className="c-card low">
              <div className="c-row">
                <div className="c-info">
                  <div className="c-name">{c.name} <span className={`badge ${danger ? 'badge-danger' : 'badge-warn'}`}>{danger ? '严重不足' : '余额偏低'}</span></div>
                  <div className="c-meta"><span>套餐：{c.planType || '-'}</span><span>联系人：{c.contact || '-'}</span></div>
                </div>
                <div className="c-bal">
                  <div className="c-bal-val" style={{ color: danger ? 'var(--danger)' : 'var(--warn)' }}>¥{c.balance.toFixed(2)}</div>
                  <div className="c-bal-lbl">阈值 ¥{c.alertThreshold.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width: Math.min(pct, 100) + '%', background: danger ? 'var(--danger)' : 'var(--warn)' }}></div></div>
                <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 4 }}>余额使用率 {pct}%，差额 ¥{(c.alertThreshold - c.balance).toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== FOLLOWUPS VIEW =====
function FollowUpsView({ onRefresh }: { onRefresh: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/followups?status=' + statusFilter);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function markDone(id: string) {
    await fetch('/api/followups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'done' }) });
    toast('已完成'); load(); onRefresh();
  }

  async function deleteFu(id: string) {
    if (!confirm('确定删除？')) return;
    await fetch('/api/followups', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast('已删除'); load(); onRefresh();
  }

  if (loading) return <Loading />;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="card">
      <div className="card-hd" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h2>{I.calendar} 跟进计划 <span className="badge badge-info">{items.length}</span></h2>
        <div className="tabs" style={{ marginBottom: 0, minWidth: 240 }}>
          {[['pending', '待办'], ['done', '已完成'], ['all', '全部']].map(([k, l]) => (
            <button key={k} className={`tab ${statusFilter === k ? 'active' : ''}`} onClick={() => setStatusFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card-bd">
        {items.length === 0 ? <Empty text="暂无跟进计划" /> : items.map(f => {
          const overdue = f.status === 'pending' && fmtDate(f.date) < today;
          return (
            <div key={f.id} className={`fu-item ${overdue ? 'overdue' : ''}`}>
              <span className={`fu-date ${overdue ? 'overdue' : ''}`}>{overdue ? '逾期 ' : ''}{fmtDate(f.date)}</span>
              <span className="fu-type">{f.type}</span>
              <span className="fu-note"><strong>{f.customer?.name}</strong> {f.note ? '- ' + f.note : ''}</span>
              <div className="fu-actions">
                {f.status === 'pending' && <><button className="btn btn-sm btn-ok" onClick={() => markDone(f.id)} title="完成">{I.check}</button><button className="btn btn-sm btn-ghost" onClick={() => deleteFu(f.id)} title="删除">{I.trash}</button></>}
                {f.status === 'done' && <span className="badge badge-ok" style={{ fontSize: 11 }}>已完成</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Utility components =====
function Loading() { return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto' }} /></div>; }
function Empty({ text }: { text: string }) { return <div className="empty"><p>{text}</p></div>; }
