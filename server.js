const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

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
  const viewUrl = `/view.html?id=${userId}&img=${fileName}`; // ✅ 고유 URL 생성
  const dataPath = path.join(__dirname, 'public/data.json');
  let data = {};

  // ✅ 기존 JSON 읽기
  if (fs.existsSync(dataPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
      console.error('❌ JSON 파싱 오류:', err);
    }
  }

  // ✅ 사용자 데이터 초기화 (배열로 잘못된 경우까지 처리)
  if (!data[userId] || typeof data[userId] !== 'object' || Array.isArray(data[userId])) {
    data[userId] = { files: [], urls: [] };
  }

  // ✅ 배열 보장
  if (!Array.isArray(data[userId].files)) data[userId].files = [];
  if (!Array.isArray(data[userId].urls)) data[userId].urls = [];

  // ✅ 파일명과 URL 저장
  data[userId].files.push(fileName);
  data[userId].urls.push(viewUrl);

  // ✅ 저장
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

  // ✅ 이미지 파일 삭제
  record.files.forEach(filename => {
    const fullPath = path.join(__dirname, 'public/images', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });

  // ✅ JSON 데이터에서 삭제
  delete data[userId];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`🗑️ 삭제 완료: ${userId}`);

  res.json({ success: true });
});

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
