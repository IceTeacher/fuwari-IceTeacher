---
title: Arch降级AUR软件源中的软件
published: 2025-03-07
description: ''
image: 'https://static1.makeuseofimages.com/wordpress/wp-content/uploads/2021/09/what-is-arch-linux.jpg'
tags: ["Linux","Arch"]
category: "Linux日常"

draft: false 
lang: 'ZH'
---





在 Arch Linux 中降级 AUR（Arch User Repository）软件包的步骤如下：

1. **查找旧版本的包**：
   - 首先，您需要找到您想要降级到的旧版本的 AUR 包。可以通过 AUR 网站或 Git 仓库找到旧版本的 PKGBUILD 文件。

2. **下载旧版本的 PKGBUILD 文件**：
   - 您可以通过访问 AUR 网站，找到您要降级的软件包，然后在“Package Actions”部分找到“View Changes”或“Git Clone URL”。
   - 例如，您可以通过以下命令克隆 AUR 仓库：
     ```bash
     git clone https://aur.archlinux.org/your-package-name.git
     cd your-package-name
     git log
     ```
   - 通过 `git log` 找到您想要的旧版本的提交哈希，然后检出该版本：
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
   - 为了防止软件包在下次系统更新时被升级，您可以在 `/etc/pacman.conf` 文件中添加以下行来忽略该包的更新：
     ```plaintext
     IgnorePkg=your-package-name
     ```

