---
title: 为你的 Twikoo 评论系统更换一个现代化的邮件通知模板
published: 2026-05-11
description: '基于 React Email 为 Twikoo 评论系统生成现代化邮件通知模板，支持本地预览、主题配置、HTML 导出和真实邮箱测试。'
image: "https://resource.rainafter.cn/img/20260512091647910.webp"
tags: ["技术","前端"]
category: "代码人生"
draft: false 
lang: 'ZH' 
---

# 为你的 Twikoo 评论系统更换一个现代化的邮件通知模板

## 一、为什么要做这个项目

Twikoo 自带的邮件通知功能已经足够好用，但如果想把邮件样式改得更符合自己博客的风格，就会遇到一个比较现实的问题：邮件模板本质上是一大段极难维护的 HTML，并且是不支持 HTML5 的 HTML。

直接编写 HTML 邮件模板并不舒服，大多数邮件 HTML 都需要使用相对于现代前端来说比较古老的 table 表格布局和内嵌 style 样式。结构稍微复杂一点，布局和样式就会变得很难维护；想看一眼效果，还需要保存配置、触发评论、等待邮件发送；而且不同邮箱客户端对 HTML 和 CSS 的兼容性也不完全一致、甚至相同邮箱的网页端与移动端APP的兼容性也不同，最终效果往往要发到真实邮箱里才能确认。

所以我做了一个小项目：[Rainafter-Twikoo-Email](https://github.com/IceTeacher/rainafter-twikoo-email)。

::github{repo="IceTeacher/rainafter-twikoo-email"}

它的目标很简单：用更现代化的前端开发方式来写 Twikoo 邮件模板。模板开发阶段可以本地预览，修改主题色和 Banner 图片也有统一配置，最后再导出为 Twikoo 可以直接使用的 HTML。

## 二、这个项目能做什么

[rainafter-twikoo-email](https://github.com/IceTeacher/rainafter-twikoo-email) 是一个基于 React Email 的 Twikoo 邮件通知模板项目，目前内置了两套主题：

- `Rainafter`：清新、简约，配色比较柔和。
- `Fuwari`：参考 Astro 博客主题 [Fuwari](https://github.com/saicaca/fuwari) 的风格和配色。

每套主题都包含两类模板：

- `notification.tsx`：访客收到评论回复通知时使用。
- `notification-admin.tsx`：站点管理员收到新评论通知时使用。

### 2.1 Rainafter 主题
Rainafter 主题以清新简约的设计风格为主，配色柔和。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; align-items: start;">
  <div align="center">
    <img src="https://resource.rainafter.cn/img/20260512011828052.webp" alt="fuwari 普通评论回复通知" style="height: 430px; aspect-ratio: 734/1037; object-fit: cover; margin-bottom: 4px;" />
    <div style="font-size: 0.9em; color: gray;">普通评论回复通知</div>
  </div>
  <div align="center">
    <img src="https://resource.rainafter.cn/img/20260512011829502.webp" alt="fuwari 管理员新评论通知" style="height: 430px; aspect-ratio: 723/789; object-fit: cover; margin-bottom: 4px;" />
    <div style="font-size: 0.9em; color: gray;">管理员新评论通知</div>
  </div>
</div>

### 2.2 Fuwari 主题
Fuwari 主题参考了知名 Astro 博客主题 [Fuwari](https://github.com/saicaca/fuwari) 的设计风格和配色方案。

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; align-items: start;">
  <div align="center">  
    <img src="https://resource.rainafter.cn/img/20260512011822983.webp" alt="rainafter 普通评论回复通知" style="height: 720px; aspect-ratio: 771/1517; object-fit: cover; margin-bottom: 8px;" />
    <div style="font-size: 0.9em; color: gray;">普通评论回复通知</div>
  </div>
  <div align="center">
    <img src="https://resource.rainafter.cn/img/20260512011825663.webp" alt="rainafter 管理员新评论通知" style="height: 720px; aspect-ratio: 753/1391; object-fit: cover; margin-bottom: 8px;" />
    <div style="font-size: 0.9em; color: gray;">管理员新评论通知</div>
  </div>
</div>

项目主要解决这几件事：

- 可以像写 React 组件一样维护邮件模板。
- 可以在本地启动预览服务，实时查看模板效果。
- 可以通过配置文件修改主题色、Banner 图片和预览数据。
- 可以导出最终 HTML，再复制到 Twikoo 的邮件通知配置中。
- 完整的测试用例，包含中文长文本、中英文混排、长链接、代码块、行内代码、远程图片、父评论和回复内容等场景，可以通过 SMTP 真实发送测试邮件，检查 QQ 邮箱、163 邮箱、Outlook、Gmail 等客户端中的实际显示效果。

如果你只是想快速换一套更现代的 Twikoo 邮件通知样式，可以直接使用本项目内置的默认主题；如果你想继续做自己的风格，也可以把它当作邮件模板开发的起点，参考下方的步骤自定义邮件模板。

## 三、开始使用

### 3.1 直接使用内置主题

若果你比较认可模板默认的效果、不想修改模板细节、配色方案或者 Banner 图片，可以直接使用项目打包后的模板。

1. 打开本项目的 [Releases](https://github.com/IceTeacher/rainafter-twikoo-email/releases/latest) 页面
2. 下载最新版本的 `out.zip`，解压后得到默认的 HTML 模板文件
3. 接下来直接参考 [七、将邮件模板添加到 Twikoo 中](#七将邮件模板添加到-twikoo-中) 的步骤，把 HTML 模板右键使用记事本打开后，将内容复制到 Twikoo 后台的邮件通知配置里即可。

<div align="center">  
  <img src="https://resource.rainafter.cn/img/20260512084643378.webp" alt="打开本项目的 Releases 页面" style="margin-bottom: 8px;" />
  <div style="font-size: 0.9em; color: gray;">打开本项目的 Releases 页面</div>
</div>

<div align="center">
  <img src="https://resource.rainafter.cn/img/20260512084646168.webp" alt="下载out.zip并解压" style="margin-bottom: 8px;" />
  <div style="font-size: 0.9em; color: gray;">下载out.zip并解压</div>
</div>

### 3.2 计划修改邮件模板

如果你想修改模板细节，或者基于现有主题开发自己的主题，建议先在本地预览确认修改效果，再导出 HTML 模板，最后再替换到 Twikoo 中。

首先把项目克隆到本地，然后安装依赖：

```bash
git clone https://github.com/IceTeacher/rainafter-twikoo-email
cd rainafter-twikoo-email
```

```bash
pnpm install
```

启动本地预览服务：

```bash
pnpm dev
```

启动后，在浏览器中打开：

```text
http://localhost:3000
```

这时就可以直接看到项目中的邮件模板预览。借助 React Email 库的本地预览功能，在修改主题模板或新建新模板时相比在 Twikoo 后台里反复保存、评论、收邮件，本地预览的效率会高很多。可以先确认整体布局、颜色、字体层级和内容长度是否合适，再考虑导出正式模板，最后再通过邮件测试用例，观察各邮件服务中的实际显示效果。

## 四、修改主题配置

### 4.1 通过配置文件修改主题配色和Banner图片
如果只是想换成自己的博客风格，建议优先从主题配置文件开始改，而不是直接改模板组件。

当前主要配置入口如下：

```text
emails/
├── rainafter/
│   ├── config.ts
│   ├── notification.tsx
│   └── notification-admin.tsx
└── fuwari/
    ├── config.ts
    ├── notification.tsx
    └── notification-admin.tsx
```

其中：

- `emails/rainafter/config.ts`：Rainafter 主题配置。
- `emails/fuwari/config.ts`：Fuwari 主题配置。
- `notification.tsx`：访客回复通知模板。
- `notification-admin.tsx`：管理员新评论通知模板。

通常你可以先调整这些内容：

- 主题颜色。
- Banner 图片地址。
- 本地预览时使用的示例评论数据。

```ts title="emails/rainafter/config.ts"
// 站点默认 Banner 图片 URL
export const defaultBannerImage = 'https://www.rainafter.cn/images/banner.jpg';

// 邮件主题色配置
export const colors = {
  pageBackground: '#EAEEF5', // 页面背景色
  emailSurface: '#FFFFFF', // 邮件卡片主体
  sectionSubtleBackground: '#F5F8FE', // 用于区分层次的次级背景色
  textPrimary: '#1F2937', // 主要文本色
  textSecondary: '#475467', // 次要文本色
  textMuted: '#667085', // 辅助文字色
  actionPrimary: '#4272B8', // 主要操作色
  actionPrimarySubtle: '#E4EFFF', // 主要操作色（柔和）
  borderSubtle: '#D7E1F0', // 次要边框色
  commentCardOriginalBackground: '#FFFFFF', // 原始评论卡片背景色
  commentCardReplyBackground: '#E4EFFF', // 回复评论卡片背景色
  commentCardNewCommentBackground: '#E4EFFF', // 新评论卡片背景色
  richContentCodeBackground: '#F4F4F4', // 富文本中代码块背景色
  richContentCodeText: '#333333', // 富文本中代码块文字色
} as const;
```

比如你想让邮件通知和自己的博客主题保持一致，就可以先替换 Banner 图片，再调整主色、背景色、链接颜色等配置。确认配置层面无法满足需求后，再去修改对应主题下的模板文件。

### 4.2 修改模板组件
如果你需要修改模板的结构或者样式细节，可以直接修改对应主题下的 `notification.tsx` 和 `notification-admin.tsx` 文件。组件里已经有完整注释。修改时建议先在本地预览确认效果，再导出 HTML 模板，最后再通过邮件测试用例检查在真实邮箱中的显示效果。

本项目使用 React Email 来开发邮件模板，组件里可以直接使用 React Email 提供的组件库和 Tailwind CSS 来构建邮件结构和样式，具体的使用方法和限制可参考 [React Email 官方文档](https://react.email/docs/introduction)。

:::note
建议在修改模板组件后参考 [六、测试邮件兼容性](#六测试邮件兼容性) 的步骤，通过真实 SMTP 发信的方式把修改后的模板发送到测试邮箱里，检查在不同邮箱客户端中的实际显示效果。
:::

## 五、导出 Twikoo 可用的 HTML 模板

本地预览确认没有问题后，就可以导出 HTML 模板：

```bash
pnpm build
```

也可以使用：

```bash
pnpm export
```

导出完成后，项目会在 `out/` 目录中生成对应的 HTML 产物。你可以根据主题和模板类型选择需要的文件：

- 普通评论回复通知：对应 `notification` 模板。
- 管理员新评论通知：对应 `notification-admin` 模板。

实际使用时，直接打开 `out/` 中对应的 HTML 文件，右键使用记事本打开后，将内容复制到 Twikoo 后台的邮件通知配置里即可。

## 六、测试邮件兼容性

邮件模板和普通网页不太一样。邮件的 HTML 不支持 HTML5 且大多只能使用 table 布局，且很多邮箱客户端会限制 CSS 能力，有些样式在浏览器里正常，在邮箱里可能就会出现间距、图片、圆角或链接显示不一致的问题。

项目提供了基于真实 SMTP 发信的测试命令，可以把导出的模板发送到你的测试邮箱中，测试数据会在邮件内容中覆盖中文长文本、中英文混排、长链接、代码块、行内代码、远程图片、父评论和回复内容等场景，检查实际显示效果。

本项目自带的 `Rainafter` 和 `Fuwari` 主题已经过测试，兼容主流邮箱的网页端和客户端，如果你基于现有主题修改或者开发了自己的主题，建议也通过测试邮件来检查最终效果。

先复制环境变量示例文件：

```bash
cp .env.example .env
```

然后在 `.env` 中填写测试用的 SMTP 信息。需要配置的核心内容包括：

```ts
EMAIL_TEST_RECIPIENTS=test@example.com
EMAIL_TEST_FROM=Rainafter Mail Test <sender@example.com>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=sender@example.com
SMTP_PASS=your-smtp-password
```

如果你的 SMTP 服务商需要 SSL/TLS 或 STARTTLS，也可以按实际情况配置：

```ts
SMTP_SECURE=false
SMTP_REQUIRE_TLS=false
EMAIL_TEST_SUBJECT_PREFIX=[email-compat]
EMAIL_TEST_SEND_DELAY_MS=1000
```

配置完成后运行：

```bash
pnpm test:email
```

这个命令会先执行构建，检查 `out/` 目录下的模板产物是否存在，然后按照“模板 × 收件人”的组合发送测试邮件。

需要注意的是，`pnpm test:email` 会真实发送邮件，所以建议使用专门的测试邮箱和 SMTP 授权码，不要把 `.env` 提交到仓库。如果配置了多个收件人，每个收件人都会收到全部模板的测试邮件。

:::note
建议在修改主题配色或模板后，配置 Outlook邮箱、Gmail 邮箱、QQ邮箱、163邮箱等常见邮箱，在对应邮箱服务商的网页端和APP端观察排版、样式等来进行测试。
:::

## 七、将邮件模板添加到 Twikoo 中

模板导出并测试完成后，就可以把它替换到 Twikoo 中了，导出后的文件在 `out/` 目录中。

```text
out/
├── rainafter/
│   ├── notification.html
│   └── notification-admin.html
└── fuwari/
    ├── notification.html
    └── notification-admin.html
```

其中：

- `emails/rainafter/`：Rainafter 主题。
- `emails/fuwari/`：Fuwari 主题。
- `notification.html`：访客回复通知模板。
- `notification-admin.html`：管理员新评论通知模板。

进入 Twikoo 管理面板，找到 `配置管理` -> `邮件通知` ，然后按模板类型填写：

找到对应主题的 `访客回复通知模板` 和 `管理员新评论通知模板` html 文件，右键使用记事本打开后复制完整内容，粘贴到 Twikoo 后台的对应输入框里：

- 将 `访客回复通知模板` 填入 `MAIL_TEMPLATE`。
- 将 `管理员新评论通知模板` 填入 `MAIL_TEMPLATE_ADMIN`。

![](https://resource.rainafter.cn/img/20260512090504939.webp)
![](https://resource.rainafter.cn/img/20260512090504940.webp)

如果你还想同时调整邮件标题，也可以配置：

- `MAIL_SUBJECT`：访客回复通知邮件标题。
- `MAIL_SUBJECT_ADMIN`：管理员新评论通知邮件标题。

保存配置后，因为并未覆盖 Twikoo 的测试邮件模板且博主自己的评论无法触发邮件通知，可自行使用除博主之外的用户名和邮箱发一条评论，触发邮件通知，检查最终效果。

## 八、最后

`Rainafter-Twikoo-Email` 本质上只是把 Twikoo 邮件模板这件事从“在后台里维护一大段 HTML”，变成了“用 React Email 开发、预览、导出和测试模板”。

如果你正在使用 Twikoo，并且想让评论通知邮件更符合自己博客的视觉风格，可以直接使用项目内置的 `Rainafter` 或 `Fuwari` 主题；如果你想继续深度定制，也可以基于现有结构扩展自己的主题。

后续如果有新的主题样式或更好的邮箱兼容性处理，我也会继续放到这个项目里。
