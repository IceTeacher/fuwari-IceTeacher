# 个人介绍

## 一、关于我
大家好！我是宇文Teacher，一名刚毕业的前端工程师，对前后端技术均充满热情，致力于设计和开发高性能、用户友好的应用程序。我热爱编程，喜欢探索新技术，尤其是那些能够提升用户体验和系统性能的前沿技术，理想是成为一名架构师。

## 二、个人总结
- 熟悉HTML、CSS、JavaScript、ES6等前端基础，熟练使用TypeScript，有前端领域开发经验，能够独立完成基本的前端开发工作。 
- 熟悉React的使用以及Umi、Next.js等框架的使用，有基于React Native的移动应用混合开发经验。 
- 了解Vue框架以及Uni-app框架的基本使用，有基于Uni-app的微信小程序开发经验。 
- 掌握Webpack和Vite的基本配置和使用，有相关工具的配置经验。 
- 掌握HTTP等计算机网络基础知识，对浏览器知识有一定的了解。 
- 熟悉Java后端开发，掌握Spring Boot、Spring MVC、MyBatis等框架，能够构建RESTful API和微服务架构。
- 熟练使用Node.js进行后端开发，掌握Express、Koa、Nest.js等框架，了解tRPC在全栈TypeScript项目中的应用。
- 具备关系型数据库(MySQL)和非关系型数据库(MongoDB)的使用经验，能够进行基本的数据库设计和优化。

## 技能
- **前端技术**：JavaScript、TypeScript、HTML、CSS、React、Vue.js
- **后端技术**：Java(Spring Boot, Spring MVC, MyBatis)、Node.js(Express, Koa, Nest.js)
- **数据库**：MySQL、MongoDB、Redis
- **开发工具**：Git、Webpack、Vite、Maven、Gradle、Docker
- **设计**：Figma、即时设计、墨刀
- **云服务**：AWS基础、阿里云、腾讯云等云服务的使用经验，熟悉云存储、云函数等服务的集成。

## 项目经验
### 1.个人博客
- **项目描述**：设计并开发了一个个人博客网站，用于分享技术文章和学习笔记。
- **技术栈**：前端使用Astro构建，利用Markdown进行内容管理；
- **挑战与收获**：通过项目实践，提升了对Astro框架的理解，并积累了处理Markdown内容的经验。

### 2.基于物品分类识别的小麦病虫害识别系统
- **项目描述**：该项目由一个AI物品分类识别服务和微信小程序前端构成。AI服务采用PaddlePaddle构建的识别模型。
- **技术栈**：微信小程序、微信小程序云开发、Python、Java Spring Boot后端服务
- **挑战与收获**：经过多次迭代优化，已实现小麦病虫害识别的准确率高达98%。微信小程序前端允许用户通过拍照来识别小麦病虫害，并提供相关信息与处理建议。后端使用Spring Boot构建了一个稳定的API服务，处理图像上传和识别结果返回，并通过MyBatis实现了与MySQL数据库的交互，存储识别历史和用户数据。

### 3.社区志愿者服务积分兑换系统
- **项目描述**：该项目包括针对志愿者用户的Uni-App微信小程序前端、针对商家用户的微信小程序前端，以及一个管理后台的前后端。志愿者用户前端提供活动列表浏览、积分商品兑换等功能；商家用户前端则支持商品核销和商家入驻操作。
- **技术栈**：
  - 前端：Uni-App、微信小程序、React、TypeScript
  - 后端：Nest.js、tRPC、Java Spring Boot、MyBatis
  - 数据库：MySQL、Redis
- **挑战与收获**：确保前后端的类型安全，并通过锁机制和事务处理确保积分兑换和商品核销过程的数据一致性和系统稳定性。使用Spring Boot实现了核心业务逻辑，通过MyBatis进行ORM映射，并使用Redis实现了高频数据的缓存，显著提升了系统性能。

### 4.番茄钟个人待办事项APP（计划开源）
- **项目描述**：该个人待办事项APP采用React Native + 原生的混合开发实现，功能包括基于番茄工作法的任务专注计时器和待办提醒。
- **技术栈**：React Native前端，Node.js Koa后端，MongoDB数据库
- **挑战与收获**：使用Kotlin和Swift分别原生开发的Android和iOS系统小组件，以提高用户的便利性和效率。后端使用Koa框架构建了轻量级API服务，实现了用户认证、任务同步和数据统计功能，通过MongoDB存储用户任务数据和完成记录。

### 5.DrawingBook儿童绘图本 （已开源）
- **项目描述**：为[DrawingBook](https://github.com/IceTeacher/DrawingBook)创建了一个原生纯血鸿蒙APP，旨在学习鸿蒙APP的功能和特性。
- **技术栈**：前端基于Harmonyos Next，使用ArkTS、ArkUI开发；后端使用Spring Boot提供API服务和图片存储功能。
- **挑战与收获**：通过项目实践，提升了对鸿蒙APP开发的理解，并积累了处理状态管理和页面组件问题的经验。
::github{repo="IceTeacher/DrawingBook"}

### 6.婚纱影楼档期管理系统
- **项目描述**：本项目采用Next.js全栈开发了一个婚纱影楼档期管理系统，包含婚纱影楼企业官网和档期管理系统的前后台，支持用户在线浏览摄影师作品、预约拍摄时间和在线支付功能。企业官网在充分利用了React服务端组件和客户端组件的优势，在保持良好用户体验的同时，显著提升了首屏加载速度。档期管理系统还包含摄影师排班管理、客片管理和数据统计分析功能，提高了影楼的运营效率。系统通过tRPC和Prisma的组合，实现了从前端到数据库的端到端完整的类型安全，大幅减少了系统在实际使用过程中可能出现的类型错误和运行时错误。系统上线后，帮助客户提升了30%的线上预约转化率，减少了50%的人工排期工作量。
- **技术栈**：
  - 前端：Next.js、TypeScript、Tailwind CSS、Shadcn/UI组件库
  - 后端：Next.js API Routes、tRPC、Prisma ORM
  - 数据库：MySQL、Redis缓存
  - 云服务：阿里云OSS存储图片、阿里云短信服务
  - 支付集成：微信支付、支付宝
- **挑战与收获**：
  - 通过Next.js实现了服务端渲染(SSR)和静态生成(SSG)，提升了页面加载速度和SEO优化
  - 使用tRPC实现了前后端的端到端类型安全通信，确保了数据的一致性和可靠性
  - 采用Prisma作为ORM工具，简化了数据库操作，提高了开发效率，同时保证了类型安全
  - 设计并实现了复杂的档期预约算法，解决了摄影师档期冲突和资源调度问题
  - 通过阿里云OSS实现了高清图片的高效存储和访问，优化了图片加载速度和用户体验
  - 实现了基于JWT的用户认证系统和基于角色的权限控制(RBAC)
  - 集成了微信支付和支付宝支付网关，实现了订单支付和退款流程
  - 使用Redis实现了热门摄影师和套餐的缓存机制，显著提升了系统响应速度
  - 开发了数据统计分析模块，为影楼管理层提供经营决策支持

## 三、专业技能详解

### 前端开发
- 熟练掌握React生态系统，包括Redux、React Router、Hooks等
- 熟悉Vue.js框架及其相关技术栈
- 精通TypeScript，能够构建类型安全的前端应用
- 熟练使用Webpack、Vite等构建工具进行项目优化

### 后端开发
- **Java技术栈**：
  - 熟练使用Spring Boot构建RESTful API和微服务
  - 掌握Spring MVC的核心概念和使用方法
  - 熟悉MyBatis和MyBatis Plus进行ORM映射
  - 了解Spring Security进行身份认证和授权
  - 具备JUnit单元测试经验

- **Node.js技术栈**：
  - 熟练使用Express和Koa构建Web服务
  - 掌握Nest.js框架，能够构建企业级Node.js应用
  - 了解tRPC在全栈TypeScript项目中的应用
  - 熟悉JWT认证机制和OAuth2.0授权流程

### 数据库
- 熟练使用MySQL进行数据库设计和优化
- 了解MongoDB等NoSQL数据库的使用场景
- 掌握Redis缓存策略和基本使用方法

## 四、兴趣爱好
- **摄影**：热衷于捕捉生活中的美好瞬间，经常在[Unsplash](https://unsplash.com/)上分享作品。
- **插画**：喜欢绘制数字插画，灵感来源于[星と少女](https://www.pixiv.net/artworks/108916539)等作品。
- **阅读**：对科技和科幻文学情有独钟，喜欢探索未来科技的发展方向；对推理小说以及其他严肃文学也有很深兴趣。
- **开源贡献**：积极参与开源社区，为多个项目提交过PR，热衷于技术分享和知识传播。

## 五、联系方式
- **邮箱**：[Ice.Teacher@Outlook.com](mailto:Ice.Teacher@Outlook.com)
- **GitHub**：[github.com/IceTeacher](https://github.com/IceTeacher)
- **个人博客**：[雨后初晴社](https://www.rainafter.cn)

感谢您的关注！作为一名前端工程师，我的理想是能够成为一名架构师，期待能将前后端技术融会贯通，在系统架构上做到彻底优化，为用户创造更优质的产品体验。期待与您在技术的世界里共同成长。