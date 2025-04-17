const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 정적 파일 제공
app.use(express.static('public'));

// 이미지 저장 위치 및 이름 설정
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

// 업로드 라우터
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  if (!req.file) {
    return res.send('❌ 이미지 업로드 실패: 파일이 없음');
  }

  const userId = req.body.userId;
  const fileName = req.file.filename;
  const imagePath = `images/${fileName}`;

  const dataPath = path.join(__dirname, 'public', 'data.json');
  let data = {};

  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(raw);
    } catch (err) {
      console.error('❗ JSON 파싱 오류:', err);
    }
  }

  data[userId] = imagePath;

  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`✅ data.json 저장 완료: ${userId} → ${imagePath}`);
  } catch (err) {
    console.error('❗ data.json 저장 실패:', err);
  }

  res.send(`<p>✅ 업로드 완료! <a href="/view.html?id=${userId}">결과 보기</a></p>`);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
