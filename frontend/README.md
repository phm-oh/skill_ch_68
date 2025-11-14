# ระบบประเมินบุคลากรออนไลน์ (Frontend)

## 🎯 Technology Stack

- **Vue 3** - Progressive JavaScript Framework
- **Vuetify 3** - Material Design Component Framework
- **Vite** - Next Generation Frontend Tooling
- **Pinia** - State Management
- **Vue Router** - Official Router
- **Axios** - HTTP Client

## 📋 Prerequisites

- Node.js >= 16.x
- npm >= 8.x
- Backend API running on port 3000

## 🚀 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Access

- Development: http://localhost:5173
- Production build: Run `npm run build` then `npm run preview`

## 📁 Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── assets/          # Images, styles
│   ├── components/      # Reusable components
│   │   ├── base/       # Base components (Card, Table, Dialog, etc.)
│   │   └── common/     # Common components (StatusChip, ScoreDisplay, etc.)
│   ├── views/          # Page components
│   │   ├── hr/         # HR system pages (7 pages)
│   │   ├── evaluatee/  # Evaluatee system pages (4 pages)
│   │   └── committee/  # Committee system pages (4 pages)
│   ├── router/         # Vue Router configuration
│   ├── services/       # API services
│   ├── stores/         # Pinia stores
│   ├── utils/          # Utility functions
│   ├── plugins/        # Vue plugins (Vuetify)
│   ├── App.vue         # Root component
│   └── main.js         # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## 👥 User Roles

### 1. Admin (ฝ่ายบุคลากร)
- จัดการผู้ใช้
- จัดการรอบการประเมิน
- จัดการหัวข้อและตัวชี้วัด
- มอบหมายกรรมการ
- ดูรายงานและสถิติ

### 2. Evaluatee (ผู้รับการประเมิน)
- ประเมินตนเอง
- อัปโหลดหลักฐาน
- ดูรายงานของตนเอง

### 3. Evaluator (กรรมการ)
- ตรวจสอบและประเมินผู้รับการประเมิน
- อนุมัติการประเมิน
- ดูรายงาน

## 🔑 Default Login

Backend ควรมีข้อมูล default users:
- Admin: username/password ที่กำหนดใน backend
- Evaluator: username/password ที่กำหนดใน backend
- Evaluatee: username/password ที่กำหนดใน backend

## 📝 API Configuration

แก้ไขไฟล์ `.env` เพื่อกำหนด Backend API URL:

```env
VITE_API_URL=http://localhost:3000/api
```

## 🛠️ Development

### การสร้าง Component ใหม่

```vue
<template>
  <div>
    <!-- Your template -->
  </div>
</template>

<script setup>
// Your script
</script>
```

### การเรียกใช้ API

```javascript
import userService from '@/services/userService';

const loadUsers = async () => {
  try {
    const response = await userService.getAll();
    users.value = response.data.data;
  } catch (error) {
    console.error(error);
  }
};
```

## 🎨 Features

### Base Components
- **BaseCard** - Card wrapper with consistent style
- **BaseTable** - Data table with search
- **BaseDialog** - Confirmation/form dialog
- **BaseAlert** - Notification snackbar
- **LoadingOverlay** - Loading spinner overlay
- **StatusChip** - Status badge
- **ScoreDisplay** - Score visualization
- **EvidenceUpload** - File upload component

### HR System (7 pages)
1. HRDashboard - Dashboard overview
2. UsersManage - User management (CRUD)
3. PeriodsManage - Evaluation periods management
4. TopicsManage - Topics management
5. IndicatorsManage - Indicators management
6. AssignmentsManage - Assign committees
7. ReportsView - Reports and statistics

### Evaluatee System (4 pages)
1. EvaluateeDashboard - Dashboard with progress
2. SelfEvaluation - Self-evaluation form
3. EvidenceManage - Manage evidence files
4. MyReport - Personal evaluation report

### Committee System (4 pages)
1. CommitteeDashboard - Dashboard overview
2. AssignmentsList - List of evaluatees to review
3. EvaluationReview - Review and evaluate
4. ApprovalPage - Approve evaluations

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Output will be in dist/ directory
# Deploy dist/ to your web server
```

## 🐛 Known Issues

- Some API endpoints may need adjustment based on actual backend implementation
- File upload requires backend to handle multipart/form-data
- Role mapping: backend uses `admin`, `evaluator`, `evaluatee`

## 📄 License

Copyright © 2024 Evaluation System Project
