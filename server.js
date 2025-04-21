const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ (선택) 배포 URL 설정 (Render 등에서 환경변수로 지정 가능)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.static('public'));

// ✅ ping 라우트 (외부 ping 서비스에서 사용)
app.get('/ping', (req, res) => {
  res.send('pong');
});

// ✅ 이미지 저장 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, 'public/images');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const userId = req.body.userId;
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      cb(null, `${userId}-${timestamp}${ext}`);
    }
  })
});

// ✅ 업로드 API
app.post('/upload', upload.single('image'), (req, res) => {
  const userId = req.body.userId;

  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
  }

  const fileName = req.file.filename;
  const viewUrl = `/view.html?id=${userId}&img=${fileName}`;
  const dataPath = path.join(__dirname, 'public/data.json');
  let data = {};

  if (fs.existsSync(dataPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
      console.error('❌ JSON 파싱 오류:', err);
    }
  }

  if (!data[userId] || typeof data[userId] !== 'object' || Array.isArray(data[userId])) {
    data[userId] = { files: [], urls: [] };
  }

  if (!Array.isArray(data[userId].files)) data[userId].files = [];
  if (!Array.isArray(data[userId].urls)) data[userId].urls = [];

  data[userId].files.push(fileName);
  data[userId].urls.push(viewUrl);

  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`✅ 저장 완료: ${userId} → ${fileName}`);
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    return res.status(500).json({ success: false, message: '파일 저장 실패' });
  }

  res.json({ success: true, userId, link: viewUrl });
});

// ✅ 리스트 조회 API
app.get('/list', (req, res) => {
  const dataPath = path.join(__dirname, 'public/data.json');
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(raw);
      return res.json(data);
    } catch (err) {
      console.error('❌ 리스트 파싱 오류:', err);
    }
  }
  res.json({});
});

// ✅ 삭제 API
app.post('/delete', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId 누락' });

  const dataPath = path.join(__dirname, 'public/data.json');
  let data = {};

  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  const record = data[userId];
  if (!record || !Array.isArray(record.files)) {
    return res.status(404).json({ success: false, message: '해당 사용자 없음' });
  }

  record.files.forEach(filename => {
    const fullPath = path.join(__dirname, 'public/images', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });

  delete data[userId];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`🗑️ 삭제 완료: ${userId}`);

  res.json({ success: true });
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: ${BASE_URL}`);
});
