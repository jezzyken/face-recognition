<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="logo">FaceID</h1>
      <nav class="nav-menu">
        <router-link to="/register" class="nav-link" active-class="active">
          <el-icon><User /></el-icon>
          <span>Register</span>
        </router-link>
        <router-link to="/verify" class="nav-link" active-class="active">
          <el-icon><View /></el-icon>
          <span>Verify</span>
        </router-link>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>Powered by Luxand Cloud</p>
    </footer>
  </div>
</template>

<script setup>
import { User, View } from '@element-plus/icons-vue';
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-link .el-icon {
  font-size: 18px;
}

.app-main {
  flex: 1;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.app-footer {
  text-align: center;
  padding: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.app-footer p {
  margin: 0;
}

/* Tablet and up */
@media (min-width: 768px) {
  .app-header {
    padding: 16px 32px;
  }

  .logo {
    font-size: 24px;
  }

  .nav-menu {
    gap: 12px;
  }

  .nav-link {
    padding: 10px 16px;
    font-size: 15px;
  }

  .nav-link .el-icon {
    font-size: 20px;
  }

  .app-main {
    padding: 32px;
  }

  .app-footer {
    padding: 16px;
    font-size: 13px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .app-header {
    padding: 20px 40px;
  }

  .logo {
    font-size: 28px;
  }

  .nav-menu {
    gap: 16px;
  }

  .nav-link span {
    display: inline;
  }

  .app-main {
    padding: 40px;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --el-color-primary: #667eea;
  --el-color-success: #67c23a;
  --el-color-warning: #e6a23c;
  --el-color-danger: #f56c6c;
  --el-color-info: #909399;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* Element Plus dark theme overrides */
.el-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.el-card__header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.el-input__wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.el-input__inner {
  color: white;
}

.el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.el-button {
  border-radius: 8px;
}
</style>
