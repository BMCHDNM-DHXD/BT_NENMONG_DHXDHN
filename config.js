// ═══════════════════════════════════════════════════════
// BT NỀN MÓNG — config.js   (GV sửa file này mỗi học kỳ)
// ═══════════════════════════════════════════════════════

window.WORKER_URL = "bt-nen-mong.bm-cdnm.workers.dev";   // Dán URL Cloudflare Worker sau khi deploy

window.MIN_ATTEMPT_PCT = 80;   // % số câu phải làm để được nộp

window.APP_INFO = {
  name:    "Bài Tập Nền Móng Online",
  subject: "Nền Móng — HP",
  school:  "Trường Đại học Xây dựng Hà Nội",
  dept:    "Bộ môn Cơ học đất – Nền móng",
};

window.CLASS_LIST = [
  { id: "64XD1",  name: "64XD1"  },
  { id: "64XD2",  name: "64XD2"  },
  { id: "64XD3",  name: "64XD3"  },
  { id: "64XD4",  name: "64XD4"  },
  { id: "64XD5",  name: "64XD5"  },
  { id: "64KT1",  name: "64KT1"  },
  { id: "64KT2",  name: "64KT2"  },
  { id: "64BDS1", name: "64BDS1" },
  { id: "64NV1",  name: "64NV1"  },
];

// Lịch mở từng CLO / chương (null = không giới hạn thời gian)
window.CHAPTER_SCHEDULE = {
  c1: { active: true,  open: null, close: null },   // CLO1 — Phương án móng
  c2: { active: false, open: null, close: null },   // CLO2 — Móng nông
  c3: { active: false, open: null, close: null },   // CLO3 — Móng cọc
  c4: { active: false, open: null, close: null },   // CLO4 — Cấu tạo
};
