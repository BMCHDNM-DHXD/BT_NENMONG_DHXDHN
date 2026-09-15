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
  // Xây dựng
  { id: "XD1",  name: "XD1"  },
  { id: "XD2",  name: "XD2"  },
  { id: "XD3",  name: "XD3"  },
  { id: "XD4",  name: "XD4"  },
  { id: "XD5",  name: "XD5"  },
  { id: "XD6",  name: "XD6"  },
  { id: "XD7",  name: "XD7"  },
  { id: "XD8",  name: "XD8"  },
  { id: "XD9",  name: "XD9"  },
  { id: "XD10", name: "XD10" },
  // Xây dựng đặc biệt
  { id: "XE1",  name: "XE1"  },
  { id: "XE2",  name: "XE2"  },
  { id: "XF",   name: "XF"   },
  // Cầu đường
  { id: "CD1",  name: "CD1"  },
  { id: "CD2",  name: "CD2"  },
  { id: "CD3",  name: "CD3"  },
  { id: "CDS",  name: "CDS"  },
  // Thủy lợi – Thủy điện
  { id: "TH1",  name: "TH1"  },
  { id: "TH2",  name: "TH2"  },
  { id: "TH3",  name: "TH3"  },
  // Khác
  { id: "CTT",  name: "CTT"  },
  { id: "CB",   name: "CB"   },
];

// Lịch mở từng CLO / chương (null = không giới hạn thời gian)
window.CHAPTER_SCHEDULE = {
  c1: { active: true,  open: null, close: null },   // CLO1 — Phương án móng
  c2: { active: false, open: null, close: null },   // CLO2 — Móng nông
  c3: { active: false, open: null, close: null },   // CLO3 — Móng cọc
  c4: { active: false, open: null, close: null },   // CLO4 — Cấu tạo
};
