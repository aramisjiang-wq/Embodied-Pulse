# Node.js 安装指南

**问题**：终端提示 `zsh: command not found: npm`

**原因**：系统中未安装 Node.js 或 Node.js 不在 PATH 环境变量中

---

## 解决方案

### 方法一：使用 nvm 安装（推荐）

**步骤 1：安装 nvm**

在终端中运行：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

**步骤 2：重新加载终端配置**

```bash
source ~/.zshrc
```

**步骤 3：安装 Node.js 20**

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

**步骤 4：验证安装**

```bash
node --version  # 应显示 v20.x.x
npm --version   # 应显示 10.x.x
```

---

### 方法二：使用 Homebrew 安装

**步骤 1：安装 Homebrew（如果未安装）**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**步骤 2：安装 Node.js**

```bash
brew install node@20
```

**步骤 3：添加到 PATH（Apple Silicon Mac）**

```bash
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### 方法三：官网下载安装包（最简单）

1. 访问 https://nodejs.org/zh-cn/
2. 下载 LTS 版本（20.x）安装包
3. 双击安装包完成安装
4. 重新打开终端

---

## 安装完成后

**更新 Next.js 依赖**：

```bash
cd "/Users/dong/Downloads/WaleHouse/01-Finance/打工-LimX（202503-至今）/Embodied Pulse/frontend"
npm install
```

**验证安装**：

```bash
npm run build
```

---

## 常见问题

### Q: 安装后仍然提示 command not found

**解决方案**：

1. 重新打开终端窗口
2. 或运行：`source ~/.zshrc`
3. 检查 PATH：`echo $PATH | grep node`

### Q: 使用 nvm 安装后，新终端找不到 node

**解决方案**：

在 `~/.zshrc` 文件末尾添加：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

然后运行：`source ~/.zshrc`

---

## 项目要求

根据 `package.json`，项目需要：

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0

---

**最后更新**：2026-02-19
