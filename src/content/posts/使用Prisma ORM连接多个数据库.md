---
title: 使用Prisma ORM连接多个数据库的最佳实践
published: 2025-08-25
description: '最近遇到了需要使用Prisma ORM同时连接两个不同MySQL数据库进行数据读写的需求。然而，Prisma ORM默认只支持单数据库连接。经过深入研究和实践，我总结出了一套适用于此类需求的最佳实践方案。'
image: "https://resource.rainafter.cn/img/20250905002439006.png?imageSlim"
tags: ["技术","前端","后端"]
category: "代码人生"
draft: false 
lang: 'ZH' 
---

## 一、起因

最近在一个Next.js + tRPC + Prisma ORM + MySQL的技术栈项目中，我遇到了需要同时连接两个不同MySQL数据库进行数据读写的需求。然而，Prisma ORM默认只支持单数据库连接，官方文档对多数据库场景的解决方案并不详细。经过深入研究和实践，我总结出了一套适用于此类需求的最佳实践方案。

## 二、我实现的Prisma多数据库连接的原理
### 2.1 单数据库的局限性
Prisma ORM的标准配置是面向单数据库设计的：
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
这种配置无法直接扩展到多数据库场景。

### 2.2 多数据库的解决思路
Prisma虽然不支持在单个`schema.prisma`文件中定义多个`datasource`块来连接多个数据库，但我们可以通过以下方式实现：
1. **创建多个独立的Schema文件：** 每个数据库对应一个schema文件
2. **生成独立的客户端：** 为每个数据库生成专用的Prisma Client
3. **统一管理连接实例：** 在应用层统一管理多个数据库连接

## 三、完整实现方案
### 3.1 项目结构：
首先，我们需要合理规划项目结构，将多个配置文件有序组织：

```ts title="项目目录结构"
project-root
 ├── next.config.js
 ├── package.json
 ├── /prisma                   // Prisma ORM配置目录
 │   ├── /prisma-client        // 自定义的Prisma客户端代码目录
 │   │   ├── /db1Client        // 数据库1的客户端
 │   │   └── /db2Client        // 数据库2的客户端
 │   ├── schema1.prisma        // 第一个数据库的Schema文件
 │   └── schema2.prisma        // 第二个数据库的Schema文件
 ├── /public
 │   ├── assets
 │   └── favicon.ico
 ├── /src
 │   ├── /app
 │   ├── /server               // 服务端代码目录
 │   │   ├── /api
 │   │   └── db.ts             // Prisma ORM数据库连接配置文件
 │   ├── /trpc
 │   └── env.js
 └── tsconfig.json
```

### 3.2 配置多个Schema文件和生成客户端
我们在`/prisma`目录下创建两个`schema.prisma`文件，分别命名为`schema.prisma`和`schema2.prisma`，分别配置不同的数据库连接。同时在`/prisma/prisma-client`目录下创建了两个子目录`db1Client`和`db2Client`，用于存放生成的Prisma客户端代码。

1. **配置不同的数据库连接**：
**在`schema1.prisma`中配置第一个数据库连接：**
```prisma
datasource db1 {
  provider = "mysql"
  url      = env("DATABASE_URL_1")
}

generator client {
  provider = "prisma-client-js"
  // 自定义客户端代码输出目录
  output   = "./prisma-client/db1Client"
}

// 在此处定义第一个数据库的模型...
```

**在`schema2.prisma`中配置第二个数据库连接：**
```prisma
datasource db2 {
  provider = "mysql"
  url      = env("DATABASE_URL_2")
}

generator client {
  provider = "prisma-client-js"
  // 自定义客户端代码输出目录
  output   = "./prisma-client/db2Client"
}

// 在此处定义第二个数据库的模型...
```
注意：我们在每个`schema.prisma`文件中都自定义了一个Prisma客户端代码输出目录为 **/prisma/prisma-client/**，以便我们再后续修改Prisma数据库连接配置文件时使用。

**关键配置说明：**
- 每个schema使用不同的数据源名称（`db1`、`db2`）
- 通过`output`字段将客户端代码生成到不同目录（默认情况下Prisma会将操作数据库的客户端代码生成在`/node_modules`文件夹下的模块自有目录内并在后续的配置文件中将客户端代码隐式引用，因此我们需要自定义`output`字段）
- 使用不同的环境变量来配置数据库连接字符串

### 3.3 创建统一的数据库连接管理器
1. **修改Prisma ORM的数据库连接配置文件：**

在`/src/server/db.ts`中创建和管理多个数据库连接：

```ts title="/src/server/db.ts"
// 导入上一步中自定义目录中生成的Prisma客户端
import { PrismaClient as DB1Client } from "../../prisma/prisma-client/db1Client"; 
import { PrismaClient as DB2Client } from "../../prisma/prisma-client/db2Client";

import { env } from "~/env";

// 第一个数据库的客户端工厂函数
const createPrismaClient = () => {
  return new DB1Client({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// 第二个数据库的客户端工厂函数
const createPrismaClient2 = () => {
  return new DB2Client({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// 开发环境下的全局实例管理，避免热重载时重复创建连接
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const globalForPrisma2 = globalThis as unknown as {
  prisma2: ReturnType<typeof createPrismaClient2> | undefined;
};

// 导出数据库连接实例
export const db = globalForPrisma.prisma ?? createPrismaClient();
export const db2 = globalForPrisma2.prisma2 ?? createPrismaClient2();

// 在非生产环境下缓存实例
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma2.prisma2 = db2;
}
```

### 3.4 更新NPM Scripts
1. **修改`package.json`中的Prisma相关命令，添加对多数据库的支持：**：

我们需要修改原来对prisma迁移的命令，在原有执行 ```prisma migrate dev``` 命令之后加入参数```--schema=./prisma/schema2.prisma```来显式声明这是对db2数据库的操作
```json title={/package.json}
{
  "scripts": {
    // 第一个数据库的操作命令
    "db:migrate-dev": "dotenv -e .env.development.local -- prisma migrate dev",
    "db:migrate": "dotenv -e .env.production.local -- prisma migrate deploy",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    
    // 第二个数据库的操作命令
    "db2:migrate-dev": "dotenv -e .env.development.local -- prisma migrate dev --schema=./prisma/schema2.prisma",
    "db2:migrate": "dotenv -e .env.production.local -- prisma migrate deploy --schema=./prisma/schema2.prisma",
    "db2:push": "prisma db push --schema=./prisma/schema2.prisma",
    "db2:studio": "prisma studio --schema=./prisma/schema2.prisma"
  }
}
```
**命令说明：**
- 通过`--schema`参数指定特定的schema文件
- 为不同数据库的命令添加前缀区分（如`db2:`）
- 保持命令的一致性和可预测性

在执行这些命令时，确保相应的环境变量（`DATABASE_URL_1`和`DATABASE_URL_2`）已正确配置。

在分别执行完两个数据库的迁移命令后，我们就可以在`/prisma/prisma-client/db1Client`和`/prisma/prisma-client/db2Client`目录下看到生成的Prisma客户端代码。此时，我们就完成了多数据库连接的配置。

## 四、使用示例
在应用代码中，我们可以通过导入`db`和`db2`来分别操作两个数据库：

```ts
import { db, db2 } from "~/server/db";

// 使用第一个数据库
const user = await db.user.findMany();

// 使用第二个数据库  
const orders = await db2.order.findMany();
```

当然，在实际应用中，还是建议根据业务需求合理划分数据库职责，避免跨库的复杂事务操作，以便充分发挥这种架构的优势。