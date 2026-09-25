/**
 * Zodiac wheel content, in reference order: clockwise from the top,
 * segment i spans [i·30°, (i+1)·30°] measured clockwise from 12 o'clock.
 */

export const ZODIAC_NAMES = [
  'Bạch Dương',
  'Kim Ngưu',
  'Song Tử',
  'Cự Giải',
  'Sư Tử',
  'Xử Nữ',
  'Thiên Bình',
  'Bọ Cạp',
  'Nhân Mã',
  'Ma Kết',
  'Bảo Bình',
  'Song Ngư',
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Stylised constellations, one per segment (same order as the names).
 * Points are [angle offset from the segment center in degrees (±12), radius];
 * edges join point indices. The first point is drawn slightly brighter.
 */
export const CONSTELLATIONS: { points: [number, number][]; edges: [number, number][] }[] = [
  // Bạch Dương
  { points: [[-9, 402], [-3, 412], [4, 404], [9, 376]], edges: [[0, 1], [1, 2], [2, 3]] },
  // Kim Ngưu
  {
    points: [[-10, 420], [-5, 396], [-1, 381], [3, 389], [8, 406], [11, 424], [2, 364]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]],
  },
  // Song Tử
  {
    points: [[-8, 426], [-7, 384], [-6, 352], [4, 428], [5, 386], [6, 356]],
    edges: [[0, 1], [1, 2], [3, 4], [4, 5], [1, 4]],
  },
  // Cự Giải
  { points: [[0, 424], [0, 392], [-7, 366], [7, 364], [1, 350]], edges: [[0, 1], [1, 2], [1, 3], [2, 4]] },
  // Sư Tử
  {
    points: [[-9, 404], [-5, 420], [1, 426], [5, 411], [3, 392], [-2, 386], [10, 370], [-8, 368]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [4, 6], [5, 7]],
  },
  // Xử Nữ
  {
    points: [[-10, 400], [-5, 406], [0, 396], [4, 410], [9, 422], [1, 376], [6, 364], [-4, 360]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7]],
  },
  // Thiên Bình
  { points: [[-7, 382], [0, 412], [7, 382], [-5, 356], [6, 354]], edges: [[0, 1], [1, 2], [2, 0], [0, 3], [2, 4]] },
  // Bọ Cạp
  {
    points: [[-10, 422], [-6, 412], [-2, 400], [1, 385], [3, 368], [7, 357], [10, 366], [11, 380]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  // Nhân Mã
  {
    points: [[-8, 396], [-3, 411], [3, 401], [8, 386], [0, 381], [-5, 368], [5, 364]],
    edges: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [4, 6], [2, 4]],
  },
  // Ma Kết
  { points: [[-10, 410], [-2, 396], [8, 406], [4, 380], [-6, 370]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  // Bảo Bình
  {
    points: [[-9, 420], [-4, 405], [0, 391], [4, 401], [9, 386], [-2, 370], [3, 357]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]],
  },
  // Song Ngư
  {
    points: [[-10, 380], [-5, 395], [0, 410], [4, 398], [9, 405], [11, 421], [6, 360], [2, 371]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 7], [7, 6]],
  },
];
