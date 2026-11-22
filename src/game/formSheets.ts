// GERADO por tools/slice_forms.py - não edite à mão.
export interface SheetInfo {
  file: string;
  texture: string;
  /** tamanho da célula (px do frame) */
  w: number;
  h: number;
  /** distância do topo da célula até os pés, e da esquerda da célula até o centro do personagem */
  feetY: number;
  anchorX: number;
  frames: Record<FrameKey, number[]>;
  /** só nas planilhas de tiro: onde a bola nasce (px do frame, relativo aos pés; +dx à frente) */
  ball?: Record<string, { dx: number; dy: number }>;
}

export type FrameKey = "idle" | "walk_right" | "walk_left" | "run_right" | "run_left" | "air" | "aura" | "transform" | "charge" | "small" | "big";
export type FormId = 'normal' | 'ssj' | 'kaioken';

type FormSheetsT = Record<FormId, { body: SheetInfo; aura: SheetInfo | null; shot: SheetInfo }>;
const RAW_FORM_SHEETS = {
  "normal": {
    "body": {
      "file": "assets/normal.png",
      "texture": "normal",
      "frames": {
        "idle": [
          0,
          1,
          2,
          3,
          4,
          5
        ],
        "walk_right": [
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13
        ],
        "walk_left": [
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ],
        "run_right": [
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29
        ],
        "run_left": [
          30,
          31,
          32,
          33,
          34,
          35,
          36,
          37
        ],
        "air": [
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45
        ]
      },
      "w": 213,
      "h": 241,
      "feetY": 236,
      "anchorX": 107
    },
    "aura": {
      "file": "assets/normal_aura.png",
      "texture": "normal_aura",
      "frames": {
        "charge": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ]
      },
      "w": 307,
      "h": 263,
      "feetY": 253,
      "anchorX": 151
    },
    "shot": {
      "file": "assets/normal_shot.png",
      "texture": "normal_shot",
      "frames": {
        "small": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ],
        "big": [
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ]
      },
      "w": 478,
      "h": 246,
      "feetY": 227,
      "anchorX": 154,
      "ball": {
        "small": {
          "dx": 123.0,
          "dy": 117.4
        },
        "big": {
          "dx": 52.9,
          "dy": 106.0
        }
      }
    }
  },
  "ssj": {
    "body": {
      "file": "assets/ssj.png",
      "texture": "ssj",
      "frames": {
        "idle": [
          0,
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "walk_left": [
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14
        ],
        "run_right": [
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ],
        "run_left": [
          22,
          23,
          24,
          25,
          26,
          27,
          28
        ],
        "air": [
          29,
          30,
          31,
          32,
          33,
          34,
          35,
          36
        ],
        "walk_right": [
          37,
          38,
          39,
          40,
          41,
          42,
          43,
          44
        ]
      },
      "w": 205,
      "h": 253,
      "feetY": 247,
      "anchorX": 103
    },
    "aura": {
      "file": "assets/ssj_aura.png",
      "texture": "ssj_aura",
      "frames": {
        "charge": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "transform": [
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18
        ]
      },
      "w": 434,
      "h": 381,
      "feetY": 353,
      "anchorX": 196
    },
    "shot": {
      "file": "assets/ssj_shot.png",
      "texture": "ssj_shot",
      "frames": {
        "small": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ],
        "big": [
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18
        ]
      },
      "w": 464,
      "h": 267,
      "feetY": 238,
      "anchorX": 188,
      "ball": {
        "small": {
          "dx": 110.7,
          "dy": 127.4
        },
        "big": {
          "dx": 37.2,
          "dy": 95.1
        }
      }
    }
  },
  "kaioken": {
    "body": {
      "file": "assets/kaioken.png",
      "texture": "kaioken",
      "frames": {
        "idle": [
          0,
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "walk_left": [
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14
        ],
        "run_right": [
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ],
        "run_left": [
          22,
          23,
          24,
          25,
          26,
          27,
          28
        ],
        "air": [
          29,
          30,
          31,
          32,
          33,
          34,
          35,
          36
        ],
        "walk_right": [
          37,
          38,
          39,
          40,
          41,
          42,
          43,
          44
        ]
      },
      "w": 242,
      "h": 276,
      "feetY": 266,
      "anchorX": 124
    },
    "aura": {
      "file": "assets/kaioken_aura.png",
      "texture": "kaioken_aura",
      "frames": {
        "charge": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "transform": [
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18
        ]
      },
      "w": 343,
      "h": 332,
      "feetY": 286,
      "anchorX": 192
    },
    "shot": {
      "file": "assets/kaioken_shot.png",
      "texture": "kaioken_shot",
      "frames": {
        "small": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ],
        "big": [
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18
        ]
      },
      "w": 472,
      "h": 267,
      "feetY": 247,
      "anchorX": 128,
      "ball": {
        "small": {
          "dx": 91.1,
          "dy": 110.9
        },
        "big": {
          "dx": 66.9,
          "dy": 96.1
        }
      }
    }
  }
};
export const FORM_SHEETS = RAW_FORM_SHEETS as unknown as FormSheetsT;
