# 客户成功工作台 (CSM Platform)

天润融通客户成功管理平台 —— 基于 Next.js 15 + Prisma + PostgreSQL 构建，支持多用户权限隔离，可部署到 Sealos 云平台。

## 功能模块

| 模块 | 说明 |
|------|------|
| 工作台首页 | 今日待处理事项、统计卡片、客户健康度分布 |
| 客户管理 | 客户档案 CRUD、搜索筛选、详情展开、跟进记录 |
| 合同预警 | 30天内到期合同自动标红/标橙，按紧急程度排序 |
| 余额预警 | 低于预警阈值自动告警，进度条可视化余额占比 |
| 跟进计划 | 回访/续约/充值/培训/投诉，待办/已完成/全部筛选 |

## 技术栈

- **前端**: Next.js 15 (App Router) + React 19 + TypeScript
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL
- **认证**: NextAuth.js (Credentials Provider, JWT)
- **部署**: Docker + Sealos (Kubernetes)

## 快速开始（本地开发）

```bash
# 1. 安装依赖
cd csm-platform
npm install

# 2. 启动本地 PostgreSQL（或用 Docker）
docker run -d --name csm-pg -p 5432:5432 \
  -e POSTGRES_DB=csm_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL=postgresql://postgres:postgres@localhost:5432/csm_platform

# 4. 初始化数据库 + 导入示例数据
npx prisma db push
npx prisma db seed

# 5. 启动开发服务器
npm run dev
```

打开 http://localhost:3000，使用演示账号登录：
- 邮箱：`demo@tinet.com`
- 密码：`demo123456`

## 多用户权限隔离

系统已实现**用户级数据隔离**：
- 每个客户经理只能看到/操作自己的客户数据
- API 层通过 JWT token 中的 userId 过滤数据
- 新增/编辑/删除操作自动关联当前用户
- 后续可扩展为管理员（admin）查看全局数据

## 部署到 Sealos

### 方式一：Sealos DevBox（推荐，最简单）

1. 登录 [Sealos](https://cloud.sealos.io)
2. 打开 DevBox → 导入本项目 Git 仓库
3. DevBox 自动检测 Next.js 项目，生成 Dockerfile
4. 一键部署，自动分配域名和数据库

### 方式二：手动 Docker 构建

```bash
# 构建镜像
docker build -t ghcr.io/YOUR_USERNAME/csm-platform:latest .
docker push ghcr.io/YOUR_USERNAME/csm-platform:latest

# 在 Sealos 中：
# 1. 创建 PostgreSQL 数据库（应用管理 → 数据库）
# 2. 创建应用，指向你的镜像
# 3. 配置环境变量：DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
# 4. 开放公网端口
```

### 方式三：Sealos Template（.sealos/template/index.yaml）

本项目已包含 Sealos 模板文件，包含：
- PostgreSQL 数据库自动创建
- 应用 Deployment + Service + Ingress
- 环境变量自动注入
- TLS 证书自动配置

## BOSS 系统 API 对接

项目预留了 `bossCustomerId` 字段，后续可开发：

```
定时任务 → 调用 BOSS API → 同步合同/余额/用量 → 更新 Prisma → 刷新预警
Webhook → 接收 BOSS 推送 → 实时更新 CRM 数据
```

详见 `../Twenty-CRM-API-对接方案.md`

## 项目结构

```
csm-platform/
├── prisma/
│   ├── schema.prisma    # 数据模型定义
│   └── seed.js          # 示例数据
├── src/
│   ├── app/
│   │   ├── api/         # API 路由 (customers, followups, dashboard, auth)
│   │   ├── dashboard/   # 主应用页面（layout + page）
│   │   ├── login/       # 登录页
│   │   ├── register/    # 注册页
│   │   ├── globals.css  # 全局样式
│   │   ├── layout.tsx   # 根布局
│   │   └── page.tsx     # 首页（重定向到 dashboard）
│   ├── components/
│   │   └── AppContext.tsx  # 全局状态（页面导航 + 刷新）
│   └── lib/
│       ├── auth.ts      # NextAuth 配置
│       └── prisma.ts    # Prisma 客户端
├── .sealos/template/    # Sealos 部署模板
├── Dockerfile           # Docker 构建文件
├── next.config.mjs      # Next.js 配置（standalone 输出）
├── tsconfig.json        # TypeScript 配置
├── package.json
└── .env.example         # 环境变量模板
```

## 演示账号

| 账号 | 邮箱 | 密码 | 角色 |
|------|------|------|------|
| 东家 | demo@tinet.com | demo123456 | 管理员 |
| 张经理 | colleague@tinet.com | demo123456 | 客户经理 |

两个账号的客户数据互相隔离，可体验多用户权限隔离效果。
