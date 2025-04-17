window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const container = document.getElementById('image-container');
  const downloadBtn = document.getElementById('download-button');
  const downloadLink = document.getElementById('download-link');

  if (!id) {
    container.innerHTML = '<p>잘못된 접근입니다. ID가 없습니다.</p>';
    return;
  }

  try {
    const res = await fetch('/data.json');
    const data = await res.json();

    const imageUrl = data[id];

    if (imageUrl) {
      container.innerHTML = `<img src="${imageUrl}" alt="Personalized Image">`;
      downloadLink.href = imageUrl;
      downloadBtn.style.display = 'block'; // 버튼 보여주기
    } else {
      container.innerHTML = `<p>해당 ID에 대한 이미지가 없습니다.</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p>이미지 로딩 실패. 다시 시도해주세요.</p>`;
  }
});
