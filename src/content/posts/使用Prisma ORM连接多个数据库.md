---
title: 使用Prisma ORM连接多个数据库的合理实现方式
published: 2025-08-25
description: '使用Prisma ORM连接多个数据库的实现方式，分享如何在Prisma中配置和使用多个数据库连接。'
image: "https://image.rainafter.cn/i/2025/03/17/67d83b2697c22.jpg"
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
1. **创建多个Prisma Schema文件**：
在项目的`/prisma`目录下创建多个`schema.prisma`文件，例如`schema.prisma`和`schema2.prisma`，分别配置不同的数据库连接，完整的项目结构如下：
```
project-root
 ├── next.config.js
 ├── package.json
 ├── /prisma
 │   ├── /prisma-client
 │   │   ├── /db1Client
 │   │   └── /db2Client
 │   ├── schema1.prisma
 │   └── schema2.prisma
 ├── /public
 │   ├── assets
 │   └── favicon.ico
 ├── /src
 │   ├── /app
 │   ├── /server
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
  output   = "./prisma-client/db2Client"
}
```

