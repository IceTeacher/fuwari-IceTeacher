---
title: 在Arch Linux上使用Sunshine和Moonlight实现使用平板电脑作为副屏
published: 2025-06-09
description: '在Arch Linux的Wayland环境下创建虚拟显示器并自建EDID文件实现与平板屏幕分辨率对应，并配合Sunshine+Moonlight的方式实现使用平板作为副屏'
image: "https://cos.rainafter.cn/img/20250609174956891.png?imageSlim"
tags: ["Linux","Arch"]
category: "Linux日常"
draft: false 
lang: 'ZH' 
---

现在的Arch默认使用Wayland，这使得之前不少资料中的通过创建虚拟显示器的方法失效（因为大多使用X11），在经过一段时间查资料后得到了完整的在Arch Linux的Wayland环境下创建虚拟显示器并自建EDID文件实现与平板屏幕分辨率对应、并配合Sunshine+Moonlight的方式实现使用平板作为虚拟显示器的方法


## 一、安装Sunshine
在Arch中可以使用Extra软件源中的正式版的`sunshine`，也可以使用AUR软件源中的预发布版`sunshine-beta-bin`

```bash
sudo pacman -S sunshine
```

```bash
yay -S sunshine-beta-bin 
```

两者二选一即可，但是在安装后的实际体验来看，本人使用sunshine时出现了在Wayland下不能正常硬件编码的问题，经测试后sunshine-beta-bin正常。故最后选用了AUR软件源中的sunshine-beta-bin

:::tip
就本文写作时间来看，sunshine的版本号是（2025.122.141614-7），sunshine-beta-bin的版本号是（2025.608.232654-1）
:::

## 二、在Wayland下配置虚拟显示器

配置虚拟显示器的方式分为两类：一种是已有显卡欺骗器硬件的方式，另一种是通过创建虚拟显示器的方式。
### 2.1. 已有显卡欺骗器硬件的方式
这种方式需要有显卡欺骗器硬件，可以直接插入电脑的HDMI接口，系统会自动识别为一个虚拟显示器。如果正好有显卡欺骗器的话，直接在电脑上插入显卡欺骗器即可解决问题，如果没有显卡欺骗器，请参考2.2部分来创建虚拟显示器。同时建议参考2.3部分修改EDID文件将显示器分辨率修改为平板电脑的原生分辨率。
### 2.2. 创建虚拟显示器的方式
在Wayland环境下，类似于使用`XrandR`工具等大多数创建虚拟显示器的方法均已经失效，经过反复尝试，最终找到了一种通过创建虚拟显示器的方式来实现的办法。
这种方式使用了[`内核级显示模式`（KMS）](https://wiki.archlinuxcn.org/wiki/%E5%86%85%E6%A0%B8%E7%BA%A7%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F%E8%AE%BE%E7%BD%AE#)来创建虚拟显示器，并通过[`强制设置显示模式`](https://wiki.archlinuxcn.org/wiki/%E5%86%85%E6%A0%B8%E7%BA%A7%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F%E8%AE%BE%E7%BD%AE#%E5%BC%BA%E5%88%B6%E8%AE%BE%E7%BD%AE%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F%E4%B8%8E_EDID)与`自定义EDID`的方式创建与平板电脑分辨率相同的虚拟显示器，其中的具体步骤如下：
#### 2.2.1. 创建虚拟显示器
使用[`强制设置显示模式`](https://wiki.archlinuxcn.org/wiki/%E5%86%85%E6%A0%B8%E7%BA%A7%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F%E8%AE%BE%E7%BD%AE#%E5%BC%BA%E5%88%B6%E8%AE%BE%E7%BD%AE%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%BC%8F%E4%B8%8E_EDID)来创建虚拟显示器时需要修改Grub的内核参数，具体步骤如下：
1. 打开GRUB配置文件
```bash"
sudo vim /etc/default/grub
```
2. 找到并在`GRUB_CMDLINE_LINUX_DEFAULT`一行中(一般在文件的靠前部分)添加参数
```shell title="/etc/default/grub" ins={"在此行的最后添加一个video=HDMI-A-xxx:e":7-9} del={6}
# GRUB boot loader configuration

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="Arch"
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog nvidia_drm.modeset=1"

GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog nvidia_drm.modeset=1 video=HDMI-A-3:e"
# xxx为你的未使用的HDMI接口号，由于是强制创建虚拟显示器，只要不占用已用接口，此处填任何数字均可以，示例填写为video=HDMI-A-3:e
GRUB_CMDLINE_LINUX=""
GRUB_DISABLE_OS_PROBER=false

# Preload both GPT and MBR modules so that they are not missed
GRUB_PRELOAD_MODULES="part_gpt part_msdos"

# Uncomment to enable booting from LUKS encrypted devices
#GRUB_ENABLE_CRYPTODISK=y

# Set to 'countdown' or 'hidden' to change timeout behavior,
# press ESC key to display menu.
GRUB_TIMEOUT_STYLE=menu

# Uncomment to use basic console
GRUB_TERMINAL_INPUT=console
```
3. 保存并退出编辑器
4. 更新Grub配置
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```
5. 重启系统后即可看到成功创建了一个虚拟显示器

### 2.3. 创建EDID文件
#### 2.3.1 根据已有显示器导出EDID文件

在创建虚拟显示器之前，需要先创建一个EDID文件，其中EDID（Extended Display Identification Data）是显示器的识别数据，可以通过以下命令生成：

1. 首先找到系统连接到的显示器
```bash
# 找出您的显示器路径
find /sys/devices/ -name edid -type f
```
2. 再将显示器的EDID数据复制到一个想要保存的目录中
```bash
# 复制 EDID 数据 (替换路径为上面找到的实际路径)
sudo cp /sys/devices/pci0000:00/0000:00:02.0/drm/card0/card1-HDMI-A-3/edid /xxxx想要保存到的路径xxxx/edid.bin
```
#### 2.3.2 自定义EDID文件

1. 自定义EDID文件，将虚拟显示器分辨率修改为平板电脑的原生分辨率
在这里推荐一个好用的EDID在线编辑网站[EDID解析与编辑工具](https://edid.wherelse.cc/)，我们在左侧上传刚才保存的EDID文件，点击解析后，在下面的水平和垂直分辨率部分修改为平板电脑的原生分辨率
![自定义EDID文件](https://cos.rainafter.cn/img/20250617140623522.png?imageSlim)
> 自定义EDID文件
编辑完成后，点击底部的下载EDID文件，并保存到一个目录中
2. 将刚才下载的自定义EDID文件复制到系统中
``` bash
sudo cp /xxxx下载的自定义EDID文件的路径xxxx/edid.bin /usr/lib/firmware/edid/hdmi.bin
```
3. 修改GRUB配置文件
```shell title="/etc/default/grub" ins={"在此行的最后添加一个drm.edid_firmware=HDMI-A-3:edid/hdmi.bin":7-8} del={6}
# GRUB boot loader configuration

GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="Arch"
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog nvidia_drm.modeset=1 video=HDMI-A-3:e"

GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog nvidia_drm.modeset=1 video=HDMI-A-3:e drm.edid_firmware=HDMI-A-3:edid/hdmi.bin"
GRUB_CMDLINE_LINUX=""
GRUB_DISABLE_OS_PROBER=false

# Preload both GPT and MBR modules so that they are not missed
GRUB_PRELOAD_MODULES="part_gpt part_msdos"

# Uncomment to enable booting from LUKS encrypted devices
#GRUB_ENABLE_CRYPTODISK=y

# Set to 'countdown' or 'hidden' to change timeout behavior,
# press ESC key to display menu.
GRUB_TIMEOUT_STYLE=menu

# Uncomment to use basic console
GRUB_TERMINAL_INPUT=console
```
4. 更新Grub配置
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```
5. 重启后，即可看到虚拟显示器的分辨率已经变为我们指定的平板的分辨率。
![成功修改分辨率后的虚拟显示器](https://cos.rainafter.cn/img/20250617135314179.png?imageSlim)
> 成功修改分辨率后的虚拟显示器
6. 将新添加的虚拟显示器作为Sunshine的默认捕捉显示器即可。

## 三、使用MoonLight作为客户端连接到电脑
### 3.1 安装Moonlight
其中iOS和iPad OS设备建议使用MoonLight砖家版（APP Store美区有上架；国区ID也可以通过TestFlight使用测试版，且测试版的版本更新、功能更多）来满足竖屏使用副屏的操作。

Android设备建议使用Moonlight阿西西修改版。

### 3.2 保证优秀的局域网环境
为了保证Moonlight连接，建议使用5Ghz的Wifi来进行无线连接