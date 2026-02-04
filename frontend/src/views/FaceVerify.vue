<template>
  <div class="verify-container">
    <el-card class="verify-card" v-loading="verifying">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><View /></el-icon>
          <span>Verify Face</span>
        </div>
      </template>

      <div class="video-container">
        <video
          ref="videoRef"
          autoplay
          muted
          playsinline
        ></video>
        <canvas ref="canvasRef" class="hidden-canvas"></canvas>

        <div v-if="!matchedUser && streamActive" class="camera-guide">
          <div class="face-oval"></div>
          <p v-if="!verifying">Position your face to verify</p>
          <p v-else class="verifying-text">Verifying...</p>
        </div>

        <div v-if="matchStatus" :class="['status-badge', matchStatus.type]">
          <el-icon v-if="matchStatus.type === 'success'"><SuccessFilled /></el-icon>
          <el-icon v-else-if="matchStatus.type === 'error'"><CircleCloseFilled /></el-icon>
          <span>{{ matchStatus.message }}</span>
        </div>
      </div>

      <div class="controls">
        <el-button
          type="primary"
          :disabled="!streamActive || verifying"
          @click="captureAndVerify"
          size="large"
          class="verify-btn"
        >
          <el-icon><Camera /></el-icon>
          {{ verifying ? 'Verifying...' : 'Verify Now' }}
        </el-button>

        <div class="secondary-controls">
          <el-button
            @click="toggleCamera"
            :type="streamActive ? 'danger' : 'default'"
            size="large"
            class="camera-btn"
          >
            <el-icon v-if="!streamActive"><VideoPlay /></el-icon>
            <el-icon v-else><VideoPause /></el-icon>
            {{ streamActive ? 'Stop' : 'Start' }}
          </el-button>

          <el-switch
            v-model="autoVerify"
            active-text="Auto"
            size="large"
            class="auto-switch"
            @change="onAutoVerifyChange"
          />
        </div>
      </div>
    </el-card>

    <el-card
      v-if="matchedUser"
      class="user-card"
    >
      <template #header>
        <div class="user-card-header">
          <el-icon class="success-icon"><SuccessFilled /></el-icon>
          <span>Verified!</span>
        </div>
      </template>

      <!-- Debug info -->
      <div style="display: none;">
        Debug: matchedUser = {{ matchedUser }}
      </div>

      <div class="user-info">
        <div class="user-avatar">
          <el-icon><User /></el-icon>
        </div>

        <div class="user-details">
          <h3 class="user-name">{{ matchedUser.name }}</h3>

          <div class="user-contact">
            <div class="contact-item">
              <el-icon><Message /></el-icon>
              <span>{{ matchedUser.email }}</span>
            </div>
            <div class="contact-item">
              <el-icon><Phone /></el-icon>
              <span>{{ matchedUser.phone }}</span>
            </div>
          </div>

          <div class="confidence-section">
            <div class="confidence-label">Confidence</div>
            <el-progress
              :percentage="Math.round(matchedUser.confidence * 100)"
              :color="getConfidenceColor(matchedUser.confidence)"
              :stroke-width="8"
            />
          </div>
        </div>
      </div>

      <el-button
        @click="resetVerification"
        type="primary"
        size="large"
        class="scan-again-btn"
        block
      >
        Scan Again
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import {
  View,
  SuccessFilled,
  CircleCloseFilled,
  Camera,
  VideoPlay,
  VideoPause,
  User,
  Message,
  Phone,
} from '@element-plus/icons-vue';

const videoRef = ref(null);
const canvasRef = ref(null);

const verifying = ref(false);
const matchedUser = ref(null);
const matchStatus = ref(null);
const streamActive = ref(false);
const streamRef = ref(null);
const autoVerify = ref(false);
let verifyInterval = null;

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  stopVerification();
  stopCamera();
});

watch(autoVerify, (newValue) => {
  if (newValue) {
    startAutoVerify();
  } else {
    stopAutoVerify();
  }
});

function onAutoVerifyChange(enabled) {
  if (enabled && !streamActive.value) {
    startCamera();
  }
}

function startAutoVerify() {
  stopAutoVerify();
  verifyInterval = setInterval(() => {
    if (streamActive.value && !verifying.value && !matchedUser.value) {
      captureAndVerify();
    }
  }, 2000);
}

function stopAutoVerify() {
  if (verifyInterval) {
    clearInterval(verifyInterval);
    verifyInterval = null;
  }
}

async function toggleCamera() {
  if (streamActive.value) {
    stopCamera();
  } else {
    await startCamera();
  }
}

async function startCamera() {
  try {
    streamRef.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    videoRef.value.srcObject = streamRef.value;
    streamActive.value = true;
  } catch (error) {
    console.error('Error accessing camera:', error);
    ElMessage.error('Unable to access camera. Please allow camera access.');
  }
}

function stopCamera() {
  stopVerification();
  stopAutoVerify();
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((track) => track.stop());
    streamRef.value = null;
  }
  streamActive.value = false;
  resetVerification();
}

async function captureAndVerify() {
  if (verifying.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const photo = canvas.toDataURL('image/jpeg', 0.8);

  await verifyFace(photo);
}

async function verifyFace(photo) {
  verifying.value = true;
  matchStatus.value = {
    type: 'scanning',
    message: 'Verifying...',
  };

  try {
    const response = await axios.post('/api/users/verify', { photo });

    console.log('Verify response:', response.data);

    if (response.data.matched) {
      matchedUser.value = {
        ...response.data.user,
        confidence: response.data.confidence,
      };
      matchStatus.value = {
        type: 'success',
        message: `Verified!`,
      };

      console.log('Matched user set:', matchedUser.value);

      if (!autoVerify.value) {
        stopCamera();
      }

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      matchedUser.value = null;
      matchStatus.value = {
        type: 'info',
        message: response.data.message || 'No match',
      };
    }
  } catch (error) {
    console.error('Verification error:', error);
    console.error('Error response:', error.response);
    console.error('Error data:', error.response?.data);
    matchedUser.value = null;
    matchStatus.value = {
      type: 'error',
      message: error.response?.data?.message || error.message || 'Failed',
    };
  } finally {
    verifying.value = false;
  }
}

function resetVerification() {
  matchedUser.value = null;
  matchStatus.value = null;
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.8) return '#67c23a';
  if (confidence >= 0.6) return '#e6a23c';
  return '#f56c6c';
}
</script>

<style scoped>
.verify-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.verify-card {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
}

.header-icon {
  font-size: 24px;
  color: #667eea;
}

.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-canvas {
  display: none;
}

.camera-guide {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.face-oval {
  width: 140px;
  height: 180px;
  border: 3px solid rgba(102, 126, 234, 0.6);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    border-color: rgba(102, 126, 234, 0.6);
  }
  50% {
    border-color: rgba(102, 126, 234, 1);
  }
}

.camera-guide p {
  margin-top: 16px;
  color: white;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.verifying-text {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-badge {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.success {
  background: rgba(103, 194, 58, 0.95);
  color: white;
}

.status-badge.error {
  background: rgba(245, 108, 108, 0.95);
  color: white;
}

.status-badge.scanning {
  background: rgba(102, 126, 234, 0.95);
  color: white;
}

.status-badge.info {
  background: rgba(144, 147, 153, 0.95);
  color: white;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.verify-btn {
  width: 100%;
}

.secondary-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.camera-btn {
  flex: 1;
}

.auto-switch {
  flex-shrink: 0;
}

/* User Card */
.user-card {
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.success-icon {
  font-size: 24px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar .el-icon {
  font-size: 40px;
  color: white;
}

.user-details {
  width: 100%;
  text-align: center;
}

.user-name {
  margin: 0 0 12px;
  font-size: 22px;
  color: white;
}

.user-contact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.contact-item .el-icon {
  font-size: 16px;
}

.confidence-section {
  text-align: left;
}

.confidence-label {
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.scan-again-btn {
  margin-top: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .verify-container {
    max-width: 600px;
    gap: 20px;
  }

  .card-header {
    font-size: 20px;
  }

  .user-info {
    flex-direction: row;
    text-align: left;
  }

  .user-details {
    flex: 1;
  }

  .user-contact {
    align-items: flex-start;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .face-oval {
    width: 180px;
    height: 220px;
  }

  .camera-guide p {
    font-size: 16px;
  }

  .user-name {
    font-size: 24px;
  }
}
</style>
