---
title: 使用Prisma ORM连接多个数据库的最佳实践
published: 2025-08-25
description: '使用Prisma ORM连接多个数据库的实现方式，分享如何在Prisma中配置和使用多个数据库连接。'
image: "https://ts1.tc.mm.bing.net/th/id/OIP-C.oVKgVXRymmMuQnvXDDPL7gHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
tags: ["技术","前端","后端"]
category: "代码人生"
draft: false 
lang: 'ZH' 
---

## 一、起因
不久前在一个私活项目中遇到一个需求，项目的技术栈使用了Next.js + tRPC + Prisma ORM + MySQL，其中需要连接两个不同的MySQL数据库来进行数据的读写操作。但一直没有找到这种需求下该方案的最佳实践，经过一番研究，最终实现了在本项目需求下较为合理的实现方式，本文将分享如何在Prisma ORM中配置和使用多个数据库连接。


## 二、过程
### 2.1 Prisma ORM默认单数据库连接
Prisma ORM默认情况下是连接单个数据库的，通常在`schema.prisma`文件中配置数据库连接字符串，例如：
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
这种配置方式适用于大多数单数据库应用场景，但当需要连接多个数据库时，就需要进行一些额外的配置。

### 2.2 配置多个数据源的原理
Prisma ORM不支持在`schema.prisma`文件中直接通过定义多个`datasource`块来配置多个数据源，但可以通过创建多个`schema.prisma`文件来实现。例如，可以创建两个不同的`schema.prisma`文件，分别用于连接不同的数据库，本文实现配置多个数据源的的原理便是如此。

### 2.3 实现步骤
此处略过Prisma的安装和基础使用，相信产生需要连接多个数据库操作需求的开发者对于Prisma ORM的基础不会陌生，本文会根据本项目的目录结构以及所需的配置对实现使用Prisma ORM连接多个数据库的方法进行详细说明。

1. **创建多个Prisma Schema文件**：
在项目的`/prisma`目录下创建多个`schema.prisma`文件，例如`schema.prisma`和`schema2.prisma`，分别配置不同的数据库连接，完整的项目结构如下（其中本项目所用的重点配置已经标明了注释）：
```ts title="项目目录结构"
project-root
 ├── next.config.js
 ├── package.json
 ├── /prisma // Prisma ORM配置目录
 │   ├── /prisma-client // 自定义的Prisma客户端代码目录
 │   │   ├── /db1Client
 │   │   └── /db2Client
 │   ├── schema1.prisma // 第一个数据库的Schema文件
 │   └── schema2.prisma // 第二个数据库的Schema文件
 ├── /public
 │   ├── assets
 │   └── favicon.ico
 ├── /src
 │   ├── /app
 │   ├── /server // 服务端代码目录
 │   │   ├── /api
 │   │   └── db.ts // Prisma ORM数据库连接配置文件
 │   ├── /trpc
 │   └── env.js
 └── tsconfig.json
```
我们在`/prisma`目录下创建两个`schema.prisma`文件，分别命名为`schema.prisma`和`schema2.prisma`，分别配置不同的数据库连接。同时在`/prisma/prisma-client`目录下创建了两个子目录`db1Client`和`db2Client`，用于存放生成的Prisma客户端代码。

2. **配置不同的数据库连接**：
在`schema1.prisma`中配置第一个数据库连接：
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
```

在`schema2.prisma`中配置第二个数据库连接：
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
```
注意：我们在每个`schema.prisma`文件中都自定义了一个Prisma客户端代码输出目录为 **/prisma/prisma-client/**，以便我们再后续修改Prisma数据库连接配置文件时使用。

3. **修改Prisma ORM的数据库连接配置文件**：
``` ts title="/src/server/db.ts"
// 导入我们在上一步骤中在自定义目录中生成的Prisma客户端，根据实际路径调整
import { PrismaClient as DB1Client } from "../../prisma/prisma-client/db1Client"; 
import { PrismaClient as DB2Clint } from "../../prisma/prisma-client/db2Client";

import { env } from "~/env";

// 创建第一个数据库的Prisma客户端实例
const createPrismaClient = () => {
  return new DB1Client({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// 创建第二个数据库的Prisma客户端实例
const createPrismaClient2 = () => {
  return new DB2Clint({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// 在开发环境下，使用全局变量来存储Prisma客户端实例，避免热重载时创建多个实例
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const globalForPrisma2 = globalThis as unknown as {
  prisma2: ReturnType<typeof createPrismaClient2> | undefined;
};

// 导出Prisma客户端实例
export const db = globalForPrisma.prisma ?? createPrismaClient();
export const db2 = globalForPrisma2.prisma2 ?? createPrismaClient2();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
if (env.NODE_ENV !== "production") globalForPrisma2.prisma2 = db2;
```

4. **修改package.json中关于Prisma操作的Script标签**：
```json title={/package.json}
{
  "scripts": {
    "db:migrate-dev": "dotenv -e .env.development.local -- prisma migrate dev",
    "db:migrate": "dotenv -e .env.production.local -- prisma migrate deploy",
    "db:push": "prisma db push",
    "db2:migrate-dev": "dotenv -e .env.development.local -- prisma migrate dev --schema=./prisma/schema2.prisma",
    "db2:migrate": "dotenv -e .env.production.local -- npx prisma migrate deploy --name init --schema=./prisma/schema2.prisma",
    "db:studio": "prisma studio",
  },
}
```
我们需要修改原来对prisma迁移的命令，在原有执行 ```prisma migrate dev``` 命令之后加入参数```--schema=./prisma/schema2.prisma```来显式声明这是对db2数据库的操作