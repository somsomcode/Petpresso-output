const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// JSON body 파싱 (삭제 API 용)
app.use(express.json());

// 정적 파일 제공
app.use(express.static('public'));

// 이미지 저장 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, 'public/images');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const userId = req.body.userId;
      const ext = path.extname(file.originalname);
      cb(null, `${userId}${ext}`);
    }
  })
});

// 업로드 API
app.post('/upload', upload.single('image'), (req, res) => {
  const userId = req.body.userId;

  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
  }

  const fileName = req.file.filename;
  const imagePath = `images/${fileName}`;
  const dataPath = path.join(__dirname, 'public', 'data.json');
  let data = {};

  // data.json 읽기
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath);
      data = JSON.parse(raw);
    } catch (err) {
      console.error('data.json 파싱 오류:', err);
    }
  }

  // 이미지 경로 저장
  data[userId] = imagePath;

  // 저장
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`✅ 저장 완료: ${userId} → ${imagePath}`);
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    return res.status(500).json({ success: false, message: '파일 저장 실패' });
  }

  res.json({ success: true, userId, link: `/view.html?id=${userId}` });
});

// 이미지 리스트 조회 API
app.get('/list', (req, res) => {
  const dataPath = path.join(__dirname, 'public', 'data.json');
  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, 'utf8');
    try {
      const data = JSON.parse(raw);
      return res.json(data);
    } catch (err) {
      console.error('❌ 리스트 파싱 실패:', err);
      return res.json({});
    }
  } else {
    return res.json({});
  }
});

// 이미지 삭제 API
app.post('/delete', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId 누락' });

  const dataPath = path.join(__dirname, 'public', 'data.json');
  let data = {};

  if (fs.existsSync(dataPath)) {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  const relativePath = data[userId];
  if (!relativePath) return res.status(404).json({ success: false, message: '해당 이미지 없음' });

  const fullImagePath = path.join(__dirname, 'public', relativePath);

  // 이미지 삭제
  if (fs.existsSync(fullImagePath)) {
    fs.unlinkSync(fullImagePath);
  }

  // data.json 갱신
  delete data[userId];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`🗑️ 삭제 완료: ${userId}`);

  res.json({ success: true });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

