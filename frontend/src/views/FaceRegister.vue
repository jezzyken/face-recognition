<template>
  <el-card class="register-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <el-icon class="header-icon"><UserFilled /></el-icon>
        <span>Register Face</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="register-form"
    >
      <el-form-item label="Full Name" prop="name">
        <el-input
          v-model="form.name"
          placeholder="Enter your name"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input
          v-model="form.email"
          placeholder="Enter your email"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Phone" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="Enter your phone number"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Face Photo">
        <div class="video-container">
          <video
            ref="videoRef"
            autoplay
            muted
            playsinline
          ></video>
          <canvas ref="canvasRef" class="hidden-canvas"></canvas>

          <div v-if="!capturedPhoto && streamActive" class="camera-guide">
            <div class="face-oval"></div>
            <p>Position your face in the oval</p>
          </div>

          <div v-if="capturedPhoto" class="captured-preview">
            <img :src="capturedPhoto" alt="Captured face" />
            <el-button
              type="danger"
              @click="clearPhoto"
              class="clear-btn"
              circle
              size="small"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="button-group">
          <el-button
            type="primary"
            :disabled="!streamActive"
            @click="capturePhoto"
            size="large"
            class="capture-btn"
          >
            <el-icon><Camera /></el-icon>
            <span>Capture</span>
          </el-button>
          <el-button
            @click="toggleCamera"
            size="large"
            :type="streamActive ? 'danger' : 'default'"
          >
            <el-icon v-if="!streamActive"><VideoPlay /></el-icon>
            <el-icon v-else><VideoPause /></el-icon>
            <span>{{ streamActive ? 'Stop' : 'Start' }}</span>
          </el-button>
        </div>
      </el-form-item>

      <el-form-item class="submit-buttons">
        <el-button
          type="success"
          :disabled="!capturedPhoto"
          @click="submitForm"
          size="large"
          class="register-btn"
        >
          <el-icon><SuccessFilled /></el-icon>
          Register Face
        </el-button>
        <el-button @click="resetForm" size="large" class="reset-btn">
          Reset
        </el-button>
      </el-form-item>
    </el-form>

    <el-dialog
      v-model="successDialog"
      title=""
      width="90%"
      class="success-dialog"
    >
      <div class="success-content">
        <el-icon class="success-icon"><SuccessFilled /></el-icon>
        <h2>Success!</h2>
        <p>Your face has been registered</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToVerify" size="large" block>
          Go to Verify
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import {
  UserFilled,
  Camera,
  SuccessFilled,
  VideoPlay,
  VideoPause,
  Close,
} from '@element-plus/icons-vue';

const router = useRouter();
const formRef = ref(null);
const videoRef = ref(null);
const canvasRef = ref(null);

const form = ref({
  name: '',
  email: '',
  phone: '',
});

const rules = {
  name: [{ required: true, message: 'Please enter your name', trigger: 'blur' }],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: 'Please enter your phone', trigger: 'blur' },
  ],
};

const loading = ref(false);
const streamActive = ref(false);
const capturedPhoto = ref(null);
const streamRef = ref(null);
const successDialog = ref(false);

onBeforeUnmount(() => {
  stopCamera();
});

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
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((track) => track.stop());
    streamRef.value = null;
  }
  streamActive.value = false;
}

function capturePhoto() {
  const video = videoRef.value;
  const canvas = canvasRef.value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.8);
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  ElMessage.success('Photo captured!');
}

function clearPhoto() {
  capturedPhoto.value = null;
}

async function submitForm() {
  await formRef.value.validate(async (valid) => {
    if (valid && capturedPhoto.value) {
      loading.value = true;
      try {
        await axios.post('/api/users/register', {
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          photo: capturedPhoto.value,
        });
        successDialog.value = true;
      } catch (error) {
        ElMessage.error(
          error.response?.data?.message || 'Registration failed'
        );
      } finally {
        loading.value = false;
      }
    }
  });
}

function resetForm() {
  formRef.value?.resetFields();
  clearPhoto();
}

function goToVerify() {
  router.push('/verify');
}
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
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

.register-form {
  padding: 4px;
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
}

.camera-guide p {
  margin-top: 16px;
  color: white;
  font-size: 14px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.captured-preview {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.captured-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.capture-btn {
  grid-column: 1 / -1;
}

.submit-buttons {
  margin-top: 20px;
}

.submit-buttons :deep(.el-form-item__content) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.register-btn {
  width: 100%;
}

.reset-btn {
  width: 100%;
}

.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 16px;
}

.success-content h2 {
  margin: 0 0 8px;
  font-size: 24px;
  color: #67c23a;
}

.success-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

/* Tablet */
@media (min-width: 768px) {
  .register-card {
    max-width: 600px;
  }

  .card-header {
    font-size: 20px;
  }

  .button-group {
    grid-template-columns: 1fr 1fr;
  }

  .capture-btn {
    grid-column: auto;
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
}
</style>
