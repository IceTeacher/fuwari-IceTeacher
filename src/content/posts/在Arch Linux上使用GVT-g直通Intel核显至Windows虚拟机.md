---
title: 在Arch Linux上使用GVT-g直通Intel核显至Windows虚拟机
published: 2026-05-02
description: '在 Arch Linux 主机上用 QEMU/KVM将 Intel 集成显卡以 GVT-g vGPU 形式分配给虚拟机的完整过程。'
image: "https://resource.rainafter.cn/img/20260504231950035.png"
tags: ["Linux","Arch"]
category: "Linux日常"
draft: false 
lang: 'ZH' 
---

# 在Arch Linux上使用GVT-g直通Intel核显至Windows虚拟机

:::note
本文记录在 Arch Linux 主机上用 QEMU/KVM 将 Intel 集成显卡以 GVT-g vGPU 形式分配给虚拟机的完整过程。写作时间为 2026-05，GVT-g 已经是维护状态很差的旧技术，但胜在操作简单、适合老平台折腾，作为在Arch Linux上Wine运行异常、或者必须使用Windows时的一种高性能且体验优秀的解决方案（GVT-g vGPU性能远超过其他虚拟机显卡），并不适合把它当作新硬件的长期方案。
:::

## 先说结论和限制

Intel GVT-g 是 Intel i915 驱动里的 vGPU/mdev 方案。它不是把整块核显独占直通给虚拟机，而是在宿主机继续使用核显的同时，把核显资源切成一个或多个 mediated
device，再通过 VFIO 交给虚拟机。虚拟机里看到的是一块 Intel 显卡，可以安装 Intel 官方驱动，性能通常比 QXL、virtio-gpu 或纯软件渲染好得多。

但是它有几个必须先接受的限制：

1. GVT-g 主要支持 Broadwell 到 Comet Lake 这一代区间的 Intel iGPU。Ice Lake 移动平台、Gen11 以及更新的 Xe/Gen12 架构通常不支持 GVT-g。新平台应优先看
   SR-IOV 或完整设备直通。
2. Intel 的 `intel/gvt-linux` 仓库已经在 2024-10-03 归档，并明确写明项目不再维护，且存在已知安全逃逸问题。因此不要把不可信虚拟机接到这个方案上。
3. GVT-g 依赖 `Intel VT-d/IOMMU`、`i915.enable_gvt=1`、`kvmgt`、`mdev`、`VFIO` 以及 libvirt/QEMU 对 mdev 的支持。少一个环节都会导致 `mdev_supported_types` 不出现。

本文的宿主机为 Intel CPU + Intel 核显，核显 PCI 地址为 `0000:00:02.0`。这是多数笔记本和台式机的默认地址，但不要盲信，实际应以 `lspci -D -nn` 为准。

## 一、BIOS/UEFI 固件设置

重启进入主板或笔记本固件设置，确认至少开启：

- `Intel Virtualization Technology` 或 `VT-x`：KVM 虚拟化 CPU 需要。
- `Intel VT-d`：IOMMU/VFIO 需要，GVT-g 必须启用。
- 核显保持启用：如果机器有独显，不要把 iGPU 完全禁用。
- 可选：把 `DVMT Pre-Allocated`、`IGD Aperture Size`、`Graphics Memory` 一类选项调大。
  如果后面 `mdev_supported_types` 目录存在但没有可用类型，或者创建 vGPU 报显存不足，
  这类选项可能有帮助。

进入系统后可以先做硬件检查：

```bash
lscpu | grep -E 'Virtualization|Model name'
lspci -D -nn | grep -Ei 'vga|3d|display'
```

典型核显行类似：

```text
0000:00:02.0 VGA compatible controller [0300]: Intel Corporation UHD Graphics 620 [8086:5917]
```

本文后续所有 `0000:00:02.0` 都要按照际地址替换。

## 二、安装 QEMU/KVM、libvirt 和 virt-manager

先更新系统：

```bash
sudo pacman -Syyu
```

安装 QEMU/KVM、libvirt 和 virt-manager 以及必要依赖：

```bash
sudo pacman -S qemu-full virt-manager libvirt ovmf dnsmasq vde2 iproute2
```

这里需要注意一个 Arch 包名变化：当前 Arch 官方仓库中的 OVMF 包名是
`edk2-ovmf`，不是 `ovmf` (本文写作时间为2026年5月)。如果 `pacman` 报 `target not found: ovmf`，请使用：

```bash
sudo pacman -S qemu-full virt-manager libvirt edk2-ovmf dnsmasq vde2 iproute2
```

各包的作用如下：

- `qemu-full`：完整 QEMU 安装集合。提供 `qemu-system-x86_64`、`qemu-img`、各类 block/audio/display 后端和桌面虚拟化常用模块。GVT-g 最终由 QEMU 的 `vfio-pci` 设备把 mdev 交给虚拟机。
- `virt-manager`：图形化虚拟机管理器。它调用 libvirt 创建、编辑、启动虚拟机，适合先完成 Windows/Linux 虚拟机基础配置，再手动补充 GVT-g XML。
- `libvirt`：虚拟机管理守护进程和 API。负责保存 domain XML、管理存储池、网络、权限、mdev/hostdev 设备，以及调用 QEMU。
- `edk2-ovmf` / 老文档里的 `ovmf`：虚拟机 UEFI 固件。Windows 11 基本应使用 OVMF；Secure Boot 相关固件文件通常位于 `/usr/share/edk2/x64/`。
- `dnsmasq`：libvirt 默认 NAT 网络的 DHCP/DNS 后端。一般不要手动启动系统级 `dnsmasq.service`，libvirt 会为每个虚拟网络启动自己的 dnsmasq 实例。
- `vde2`：Virtual Distributed Ethernet，QEMU 可用的虚拟以太网工具。普通 virt-manager/libvirt NAT 网络不一定直接用到它，但安装完整 QEMU 桌面环境时常见。
- `iproute2`：提供 `ip`、`ss`、`tc` 等网络工具。排查 `virbr0`、tap、路由和地址时必备。

如果 libvirt 默认 NAT 网络报错，还可能需要额外安装：

```bash
sudo pacman -S iptables-nft
```

`libvirt` 把 `dnsmasq` 和 `iptables-nft` 都列为默认 NAT/DHCP 网络相关的可选依赖。

启用 libvirt：

```bash
sudo systemctl enable --now libvirtd
```

把当前用户加入常用虚拟化组：

```bash
sudo usermod -aG libvirt,kvm "$USER"
```

注销并重新登录，或者临时执行：

```bash
newgrp libvirt
```

启动并设置默认 NAT 网络自启：

```bash
sudo virsh net-autostart default
sudo virsh net-start default
sudo virsh net-list --all
```

如果 `default` 已经是 active，`net-start` 报错“already active”是正常现象。

## 三、设置 GRUB 内核参数

GVT-g 需要 IOMMU 和 i915 GVT 开关。编辑：

```bash
vim /etc/default/grub
```

找到 `GRUB_CMDLINE_LINUX_DEFAULT`，加入下面这些参数：

```text
intel_iommu=on iommu=pt i915.enable_gvt=1 i915.enable_guc=0 i915.enable_fbc=0
```

一个完整例子：

```bash title="GRUB_CMDLINE_LINUX_DEFAULT" del={1} ins={"新增上述参数":2-3}
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet"

GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet intel_iommu=on iommu=pt i915.enable_gvt=1 i915.enable_guc=0 i915.enable_fbc=0"
```

参数解释：

- `intel_iommu=on`：启用 Intel VT-d/IOMMU。没有它，VFIO/mdev 设备无法安全分配给虚拟机。
- `i915.enable_gvt=1`：启用 i915 的 GVT-g 支持。没有它，通常不会出现
  `/sys/bus/pci/devices/0000:00:02.0/mdev_supported_types/`。
- `i915.enable_guc=0`：关闭 GuC/HuC 固件加载。[ArchWiki](https://wiki.archlinux.org/title/Intel_GVT-g) 中对 GVT-g 与 GuC/HuC 的组合有警告，为了稳定性这里按 GVT-g 文档关闭。
- `i915.enable_fbc=0`：可选，关闭 framebuffer compression。在使用 DMA-BUF 显示的场景下更稳定。
- `iommu=pt`：可选，把未直通设备放在 passthrough IOMMU 模式，可能降低宿主机 IOMMU 开销。

生成 GRUB 配置：

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

然后重启：

```bash
sudo reboot
```

重启后确认参数生效：

```bash
cat /proc/cmdline
dmesg | grep -Ei 'DMAR|IOMMU|GVT|i915'
```

能看到类似 `Intel-IOMMU: enabled`、`DMAR`、`GVT`、`i915` 的相关输出则证明配置成功。如果完全没有 IOMMU 信息，先参考[第一步](#一biosuefi-固件设置)在 BIOS 检查 VT-d，再检查 GRUB 参数是否真的生效。

## 四. 启动 KVM、VFIO 和 mdev 模块

创建 `/etc/modules-load.d/kvm.conf`：

```bash
sudoedit /etc/modules-load.d/kvm.conf
```

写入：

```text title="/etc/modules-load.d/kvm.conf"
kvm
kvm_intel
kvmgt
vfio
vfio_iommu_type1
mdev
```

说明：

- `kvm`：KVM 核心模块。
- `kvm_intel`：Intel CPU 的 KVM 加速模块。AMD 平台才是 `kvm_amd`，但本文是 Intel GVT-g。
- `kvmgt`：Intel GVT-g 的 KVM 后端。
- `vfio`：VFIO 核心，用于直通设备到虚拟机。
- `vfio_iommu_type1`：VFIO IOMMU 后端，GVT-g mdev 需要它来分配给虚拟机。
- `mdev`：Linux mediated device 框架。

有些内核会把某些模块编译进内核，`lsmod` 看不到不一定是坏事；但如果`systemd-modules-load` 明确报模块不存在，要确认当前正在运行的内核和`/usr/lib/modules/$(uname -r)` 是否匹配。Arch 更新内核后未重启时，很容易出现“新模块目录已安装，当前运行旧内核加载不到模块”的现象。

立即加载一次，避免等待重启：

```bash
sudo modprobe kvm
sudo modprobe kvm_intel
sudo modprobe vfio
sudo modprobe vfio_iommu_type1
sudo modprobe mdev
sudo modprobe kvmgt
```

检查：

```bash
lsmod | grep -E 'kvm|kvm_intel|kvmgt|vfio|mdev'
```

再检查核显是否暴露 mdev 类型：

```bash
ls /sys/bus/pci/devices/0000:00:02.0/mdev_supported_types/
```

如果目录不存在，优先排查：

1. CPU/iGPU 是否在 GVT-g 支持范围内。
2. BIOS 是否开启 VT-d。
3. `/proc/cmdline` 是否真的有 `intel_iommu=on i915.enable_gvt=1 i915.enable_guc=0`。
4. `kvmgt` 模块是否成功加载。
5. `dmesg | grep -i gvt` 是否出现 `Unsupported device. GVT-g is disabled`。

## 五、安装并使用 mdevctl 创建 GVT-g vGPU

`mdevctl` 是 mediated device 的管理和持久化工具。它会把定义保存到 `/etc/mdevctl.d/`，并通过 udev 在父设备可用时自动创建设置为 `auto` 的 mdev。

安装 `mdevctl` 的 AUR 包：

```bash
yay -S mdevctl
```

安装后列出可创建的 mdev 类型：

```bash
mdevctl types
```

具体名字由平台决定，一般来说，同一平台内编号更低的类型分配更多显存、更高分辨率或更多 GPU 时间片，但可同时创建的实例更少。创建前可以看 mdevctl types 命令的输出：

例如：

```bash
0000:00:02.0
  i915-GVTg_V5_4
    Available instances: 0
    Device API: vfio-pci
    Name: GVTg_V5_4
    Description: low_gm_size: 128MB, high_gm_size: 512MB, fence: 4, resolution: 1920x1080, weight: 4
  i915-GVTg_V5_8
    Available instances: 0
    Device API: vfio-pci
    Name: GVTg_V5_8
    Description: low_gm_size: 64MB, high_gm_size: 384MB, fence: 4, resolution: 1024x768, weight: 2
```

定义一个自动启动的 GVT-g vGPU：

```bash
sudo mdevctl define --auto --uuid $(uuidgen) --parent 0000:00:02.0 --type i915-GVTg_V5_4
```

注意：`define --auto` 的含义是“创建持久化定义，并设置为父设备出现时自动启动”。它不会总是等价于“当前立刻创建一个已经运行的 mdev”。为了现在就用，继续执行：

```bash
sudo mdevctl start --uuid "$GVT_UUID"
```

检查当前运行的 mdev：

```bash
mdevctl list
mdevctl list -d
ls -l "/sys/bus/mdev/devices/$GVT_UUID"
```

可以看到 GVT-g vGPU 设备成功创建，如果 virt-manager 或 libvirt 看不到新设备，重启 libvirt：

```bash
sudo systemctl restart libvirtd
```

如果要删除设备：

```bash
sudo mdevctl stop --uuid "$GVT_UUID"
sudo mdevctl undefine --uuid "$GVT_UUID"
```

## 六、用 virt-manager 创建基础虚拟机

建议先创建一台普通虚拟机，安装好系统和驱动，再添加 GVT-g。这样排错简单，毕竟如果加 GVT-g vGPU 后黑屏，还能回退到普通显示设备。

### 6.1 新建虚拟机

打开 virt-manager （安装后在DE桌面环境中名字往往是 "虚拟系统管理器"） ，在界面中：

1. 连接到 `QEMU/KVM` 系统会话，不是用户会话。系统会话通常显示为
   `qemu:///system`，权限和 mdev/VFIO 配合更省事。
2. 点击“新建虚拟机”。
3. 选择本地 ISO，例如 Windows 11 的镜像文件。
4. 选择系统类型。Windows 11 请选择 Windows 11，或至少 Windows 10/11 相近模板。
5. 分配 CPU 和内存。示例：4 vCPU、8 GiB RAM。
6. 创建 qcow2 磁盘。示例：60 GiB 或更大。
7. 勾选“安装前自定义配置”。

<div style="
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
    gap: 15px; 
    justify-content: center;
">
    <img src="https://resource.rainafter.cn/img/20260504190853073.webp" style="width: 100%; height: auto; display: block;" />
    <img src="https://resource.rainafter.cn/img/20260504190853074.webp" style="width: 100%; height: auto; display: block;" />
    <img src="https://resource.rainafter.cn/img/20260504190853075.webp" style="width: 100%; height: auto; display: block;" />
</div>
<div style="text-align: center; font-size: 0.9em; color: gray;">新建虚拟机</div>

### 6.2 配置基础硬件

在“概况”里调整：

- 芯片组：`Q35`。
- 固件：`UEFI x86_64` / OVMF。Windows 11 推荐 UEFI + TPM 2.0。
- CPU：`host-passthrough`。注意在拓扑中勾选手动设置CPU拓扑，例如设置 sockets=1（插槽数）、cores=2（核心数）、threads=2（线程数）即表示共分配 1x2x2=4 个CPU核心。
- 磁盘总线：新装系统推荐 `VirtIO`，但 Windows 安装时要加载 VirtIO 驱动 ISO；为了省事也可以先用 SATA，安装完再迁移。
- 网卡：`virtio` 性能最好；若安装阶段缺驱动，可临时用 `e1000e`。
- 显示：初始安装阶段先保留 `SPICE` + `Video QXL` 或 `Virtio`，安装完系统和远程访问后再移除。
- Windows 11：添加 `TPM`，型号选 `CRB`，版本 `2.0`。

<div style="
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
    gap: 15px; 
    justify-content: center;
">
    <img src="https://resource.rainafter.cn/img/20260504191142926.webp" style="width: 100%; height: auto; display: block;" />
    <img src="https://resource.rainafter.cn/img/20260504191142927.webp" style="width: 100%; height: auto; display: block;" />
    <img src="https://resource.rainafter.cn/img/20260504191142928.webp" style="width: 100%; height: auto; display: block;" />
    <img src="https://resource.rainafter.cn/img/20260504191142929.webp" style="width: 100%; height: auto; display: block;" />
</div>
<div style="text-align: center; font-size: 0.9em; color: gray;">配置基础硬件</div>

启动虚拟机，完成系统安装。Windows 客户机里建议安装：

- VirtIO 驱动：磁盘、网卡、balloon、qemu guest agendt 等客户机驱动，可以点击[下载链接](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso)跳转至Fedora People的virtio-win.iso最新版下载页面。
- Intel 核显驱动：添加 GVT-g 后需要它接管 vGPU，可以先在 Intel 官网下载驱动程序

在虚拟机下载 virtio-win.iso 后可以直接在资源管理器中双击打开，之后分别安装 `virtio-win-gt-x64.msi`（图形相关驱动）和 `virtio-win-guest-tools-x64.msi`（增强功能工具）。安装完成后重启虚拟机。

![安装 virtio-win 驱动](https://resource.rainafter.cn/img/20260504203348236.webp)
<div style="text-align: center; font-size: 0.9em; color: gray;">安装 virtio-win 驱动</div>

安装 virtio-win 驱动后主机便可以与虚拟机共享剪贴板、传输文件、调整分辨率（但其驱动的 QXL 虚拟显卡性能远远不如接下来将要添加的 GVT-g vGPU）。

## 七、在 virt-manager 中添加 GVT-g vGPU

关闭虚拟机，注意不要挂起，而是完全关闭虚拟机。

1. 打开虚拟机“详细信息”。
2. 点击“添加硬件”。
3. 选择 `MDEV主机设备`。
4. 找到刚创建的 GVT-g vGPU mdev 设备，名称通常包含 UUID，或显示为 `mdev_...`。
5. 添加到虚拟机。

![添加 GVT-g mdev 设备](https://resource.rainafter.cn/img/20260504193405584.webp)
<div style="text-align: center; font-size: 0.9em; color: gray;">添加 GVT-g mdev 设备</div>

添加后启动虚拟机，如果一切顺利，客户机里应该能看到新的 Intel 显卡设备（或除了已经添加的QXL显卡外，额外显示一个 Microsoft 标准显示适配器），安装官方的 Intel 显卡驱动后就可以使用了。


## 八、显示输出：使用 Looking Glass 标准共享内存

安装好 Intel 显卡驱动后，虚拟机里通常会同时看到 QXL/virtio 虚拟显卡和 Intel GVT-g vGPU。为了让 Windows 桌面真正跑在 Intel vGPU 上，同时获得比 SPICE/QXL 更流畅的低延迟画面，本文使用 [Looking Glass](https://looking-glass.io/) 作为显示输出方案。

:::note
需要特别说明的是：Looking Glass 官方更推荐 `KVMFR` 模块，因为 `KVMFR` 可以让 GPU 通过 DMA 访问共享内存，性能更好。但经过实测 `KVMFR` 方式会与 `virtiofs` 冲突，无法将Arch Linux主机的文件夹共享至虚拟机，原因是 `virtiofs` 依赖虚拟机内存共享来完成零拷贝的数据读写，但是 `virtiofs` 无法将 `KVMFR` 模块创建的设备的内存共享，造成冲突。因此本文按照 Looking Glass B7 文档中的 [IVSHMEM 共享内存方式](https://looking-glass.io/docs/B7/ivshmem_shm/) 方式配置，也就是使用 `/dev/shm/looking-glass` 作为标准共享内存后端。
:::

### 8.1 在 Windows 虚拟机中安装 Looking Glass Host

安装步骤：

1. 在 Windows 虚拟机里打开 Looking Glass 下载页：<https://looking-glass.io/downloads>。
2. 下载与宿主机客户端版本一致的 `looking-glass-host-setup.exe`，例如 B7 对 B7。
3. 右键安装器，选择“以管理员身份运行”。
4. 按安装向导一路继续。默认选项适合大多数场景，安装器会安装 IVSHMEM 驱动和 Looking Glass Host 服务。
5. 安装完成后，Looking Glass Host 会作为 Windows 服务运行。

安装完成后关闭虚拟机，继续下面的显示设备调整和共享内存配置。

### 8.2 调整虚拟机显示设备

先关闭虚拟机，不要挂起。

打开 virt-manager（虚拟系统管理器），选择已经创建的 Windows 虚拟机，进入“虚拟机详情”：

1. 左侧找到“显卡”设备，通常是“显卡 QXL”，点击进入。
2. 将视频型号改为 `None`。这样 Windows 启动后主要显示设备就是 Intel GVT-g vGPU。
3. 如想要保留Windows启动前的BIOS画面，把上述的视频型号改为 `Ramfb` 即可。

![调整显示设备](https://resource.rainafter.cn/img/20260504221702647.webp)
<div style="text-align: center; font-size: 0.9em; color: gray;">调整显示设备</div>

### 8.3 添加 Looking Glass 标准共享内存设备

在 virt-manager 的虚拟机详情界面，点击第一个 `概况` ，再点击 详情 旁的 XML，滚动到最后，在 `<devices>` 节点内加入一个新的共享内存设备：

```xml
<shmem name="looking-glass">
  <model type="ivshmem-plain"/>
  <size unit="M">32</size>
</shmem>
```

![添加共享内存设备](https://resource.rainafter.cn/img/20260504222625023.webp)
<div style="text-align: center; font-size: 0.9em; color: gray;">添加共享内存设备</div>

其中 `32M` 适合 1920x1080 SDR。Looking Glass 官方给出的计算方式是：

```text
宽度 x 高度 x BPP x 2 = frame size in bytes
frame size / 1024 / 1024 = frame size in MiB
frame size in MiB + 10 = required size in MiB
向上取整到 2 的幂 = 最终大小
```

其中 SDR 32-bit RGB 的 `BPP` 为 `4`，HDR 64-bit 为 `8`。常见取值可以直接按下面选择：

| 分辨率    |  SDR |  HDR |
| --------- | ---: | ---: |
| 1920x1080 |  32M |  64M |
| 1920x1200 |  32M |  64M |
| 2560x1440 |  64M | 128M |
| 3840x2160 | 128M | 256M |

这个值不是越大越好，设得过大只会固定占用宿主机内存。若设置太小，Looking Glass 会截断画面底部并提示需要增大共享内存。

### 8.4 设置 `/dev/shm/looking-glass` 权限

标准共享内存方式会使用 `/dev/shm/looking-glass`。默认情况下，这个文件可能由 QEMU 创建并归 QEMU 用户所有，普通用户运行 `looking-glass-client` 时无法读写。接下来我们使用 `systemd-tmpfiles` 预先创建并设置权限。

新建 `/etc/tmpfiles.d/10-looking-glass.conf`：

```bash
vim /etc/tmpfiles.d/10-looking-glass.conf
```

写入：

```text title="/etc/tmpfiles.d/10-looking-glass.conf"
# Type Path                    Mode UID         GID Age Argument
f /dev/shm/looking-glass       0660 User        kvm -
```

把其中的 `User` 改成实际的 Arch Linux 用户名。然后执行：

```bash
sudo systemd-tmpfiles --create /etc/tmpfiles.d/10-looking-glass.conf
ls -l /dev/shm/looking-glass
```

输出中应能看到文件归 Arch Linux 所使用的用户和 `kvm` 组所有，权限为 `rw-rw----`。

如果后续修改了 `<size unit='M'>...</size>` 的大小，需要先关闭虚拟机，再删除旧共享内存文件再重新创建：

```bash
sudo rm -f /dev/shm/looking-glass
sudo systemd-tmpfiles --create /etc/tmpfiles.d/10-looking-glass.conf
```

### 8.5 在 Arch Linux 宿主机安装 Looking Glass Client

Arch 上可从 AUR 安装 Looking Glass 客户端。AUR 包名是 `looking-glass`，安装后提供的命令是 `looking-glass-client`：

```bash
yay -S looking-glass
```

安装完成后在 virt-manager 启动 Windows 虚拟机，再打开桌面环境中的 Looking Glass Client 即可看到虚拟机画面，并且在安装 Intel 驱动后，直通的显卡也正常使用，其性能远超过普通的虚拟机自带显卡，完全可以作为在Arch Linux上必须使用Windows时的解决方案。
![Looking Glass Client 显示虚拟机画面](https://resource.rainafter.cn/img/20260504230356377.webp)
<div style="text-align: center; font-size: 0.9em; color: gray;">Looking Glass Client 显示虚拟机画面</div>

## 九、验证虚拟机的 GVT-g vGPU 是否正常工作

虚拟机启动前确认 mdev 存在：

```bash
mdevctl list
ls /sys/bus/mdev/devices/
```

启动虚拟机后查看 QEMU 日志：

```bash
sudo journalctl -u libvirtd -b
sudo ls /var/log/libvirt/qemu/
sudo tail -n 200 /var/log/libvirt/qemu/<虚拟机名称>.log
```

虚拟机内验证：设备管理器中应出现 Intel 显卡；安装 Intel 驱动后不应是 Microsoft基本显示适配器。

宿主机验证 GPU 活动可用：

```bash
sudo pacman -S intel-gpu-tools
sudo intel_gpu_top
```

如果虚拟机观看视频时能看到 render/blitter/video 活动变化，说明 vGPU 在工作。

## 十、常见故障

### 10.1 `/mdev_supported_types` 不存在

检查：

```bash
cat /proc/cmdline
lsmod | grep -E 'kvmgt|mdev|vfio'
dmesg | grep -Ei 'gvt|i915|dmar|iommu'
lspci -D -nn | grep -Ei 'vga|display'
```

常见原因：

- 硬件不是 Broadwell 到 Comet Lake 这类 GVT-g 支持平台。
- BIOS 没开 VT-d。
- GRUB 参数没有生效。
- `i915.enable_guc=0` 没设置，或 GuC/HuC 配置与 GVT-g 冲突。
- `kvmgt` 没加载。
- 内核升级后未重启，导致当前内核找不到匹配模块。

### 10.2 `mdevctl define/start` 报没有空间或没有实例

检查可用实例数：

```bash
cat /sys/bus/pci/devices/0000:00:02.0/mdev_supported_types/i915-GVTg_V4_1/available_instances
```

如果是 `0`，说明该类型已经被占用，或显存资源不够。可以换更小类型，例如从 `V4_1`
换成 `V4_2`、`V4_4`，具体以 `mdevctl types` 输出为准。

### 10.3 virt-manager 看不到 mdev

先确认 mdev 已启动：

```bash
mdevctl list
```

再重启 libvirt：

```bash
sudo systemctl restart libvirtd
```

还可以用 libvirt 节点设备命令看：

```bash
virsh nodedev-list --cap mdev
virsh nodedev-list --cap mdev_types
```
