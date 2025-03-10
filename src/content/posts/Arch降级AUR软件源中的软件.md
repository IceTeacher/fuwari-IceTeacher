---
title: Arch降级AUR软件源中的软件
published: 2025-03-07
description: 最近Typora突然不能用了，提示我需要激活，后来看了Yporaject的说明才发现原来不支持1.10版本的Typora，遂准备开始降级。
image: https://static1.makeuseofimages.com/wordpress/wp-content/uploads/2021/09/what-is-arch-linux.jpg
tags:
  - Linux
  - Arch
category: Linux日常
draft: false
lang: ZH
---



## 一、起因
本来用Arch Linux的系统一直挺好，Typora也一直用的好好的，当然，还是靠的是[Yporaject](https://github.com/hazukieq/Yporaject)来激活，但是最近Typora突然不能用了，提示我需要激活，后来看了Yporaject的说明才发现原来不支持1.10版本的Typora，遂准备开始降级。
::github{repo="hazukieq/Yporaject"}


## 二、过程
### 2.1 遇到的坑
我的Typora是通过AUR源安装的1.10.8-1版本，所以需要降级到1.9.x版本。

查了下关于Arch Linux降级软件包的方法，发现了一个叫Downgrade的工具，遂准备尝试一下。

![Downgrade](https://cos.rainafter.cn/img/20250308201648474.jpg?imageSlim)

结果很不巧，AUR源只有当前最新版的Typeora安装包，而我的本地也没有老版本的缓存，只好想办法通过AUR源的Typora仓库直接手动构建一个低版本的安装包



### 2.2 解决方案

在 Arch Linux 中降级 AUR（Arch User Repository）软件包的步骤如下：

1. **查找旧版本的包**：
   - 首先，找到想要降级到的旧版本的 AUR 包。可以通过 AUR 网站或 Git 仓库找到旧版本的 PKGBUILD 文件。

2. **下载旧版本的 PKGBUILD 文件**：
   - 可以通过访问 AUR 网站，找到您要降级的软件包，然后在“Package Actions”部分找到“View Changes”或“Git Clone URL”。
   - 通过以下命令克隆 AUR 仓库：
     ```bash
     git clone https://aur.archlinux.org/your-package-name.git
     cd your-package-name
     git log
     ```
   - 通过 `git log` 找到想要的旧版本的提交哈希，然后检出该版本：
     ```bash
     git checkout <commit-hash>
     ```

3. **构建和安装旧版本的软件包**：
   - 使用 `makepkg` 命令构建包：
     ```bash
     makepkg -si
     ```
   - 这将根据旧版本的 PKGBUILD 文件构建并安装软件包。

4. **锁定软件包版本**（可选）：
   - 为了防止软件包在下次系统更新时被升级，可以在 `/etc/pacman.conf` 文件中添加以下行来忽略该包的更新：
     ```plaintext
     IgnorePkg=your-package-name
     ```

## 三、最后

最后也是终于看到了激活成功的动画。

![成功](https://cos.rainafter.cn/img/20250308202153890.png?imageSlim)
