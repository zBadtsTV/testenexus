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
  frames: Record<string, number[]>;
  /** só nas planilhas de tiro: onde a bola nasce (px do frame, relativo aos pés; +dx à frente) */
  ball?: Record<string, { dx: number; dy: number }>;
}

export type FormId = 'normal' | 'ssj' | 'kaioken';

export const FORM_SHEETS: Record<FormId, { body: SheetInfo; aura: SheetInfo | null; shot: SheetInfo }> = {
  "normal": {
    "body": {
      "file": "assets/normal.png",
      "texture": "normal",
      "frames": {
        "walk_right": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "walk_left": [
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15
        ],
        "run_right": [
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23
        ],
        "run_left": [
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31
        ],
        "air": [
          32,
          33,
          34,
          35,
          36,
          37,
          38,
          39
        ],
        "idle": [
          40,
          41,
          42,
          43
        ]
      },
      "w": 213,
      "h": 214,
      "feetY": 209,
      "anchorX": 107
    },
    "aura": {
      "file": "assets/normal_aura.png",
      "texture": "normal_aura",
      "frames": {
        "charge_start": [
          0,
          1,
          2
        ],
        "charge": [
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ]
      },
      "w": 202,
      "h": 247,
      "feetY": 225,
      "anchorX": 107
    },
    "shot": {
      "file": "assets/normal_shot.png",
      "texture": "normal_shot",
      "frames": {
        "hold": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "small": [
          8,
          9,
          10
        ]
      },
      "w": 181,
      "h": 207,
      "feetY": 201,
      "anchorX": 78,
      "ball": {
        "small": {
          "dx": 115.1,
          "dy": 84.8
        },
        "big": {
          "dx": 42.6,
          "dy": 84.9
        }
      }
    }
  },
  "ssj": {
    "body": {
      "file": "assets/ssj.png",
      "texture": "ssj",
      "frames": {
        "walk_left": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "run_right": [
          8,
          9,
          10,
          11,
          12,
          13,
          14
        ],
        "run_left": [
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ],
        "air": [
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29
        ],
        "walk_right": [
          30,
          31,
          32,
          33,
          34,
          35,
          36,
          37
        ],
        "idle": [
          38,
          39,
          40,
          41
        ]
      },
      "w": 205,
      "h": 240,
      "feetY": 234,
      "anchorX": 103
    },
    "aura": {
      "file": "assets/ssj_aura.png",
      "texture": "ssj_aura",
      "frames": {
        "transform": [
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
        "charge_start": [
          11,
          12,
          13
        ],
        "charge": [
          14,
          15,
          16,
          17
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
        "hold": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "small": [
          8,
          9,
          10
        ]
      },
      "w": 203,
      "h": 233,
      "feetY": 224,
      "anchorX": 87,
      "ball": {
        "small": {
          "dx": 134.6,
          "dy": 77.7
        },
        "big": {
          "dx": 52.8,
          "dy": 94.4
        }
      }
    }
  },
  "kaioken": {
    "body": {
      "file": "assets/kaioken.png",
      "texture": "kaioken",
      "frames": {
        "walk_left": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "run_right": [
          8,
          9,
          10,
          11,
          12,
          13,
          14
        ],
        "run_left": [
          15,
          16,
          17,
          18,
          19,
          20,
          21
        ],
        "air": [
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29
        ],
        "walk_right": [
          30,
          31,
          32,
          33,
          34,
          35,
          36,
          37
        ],
        "idle": [
          38,
          39,
          40,
          41
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
        "transform": [
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
        "charge_start": [
          11,
          12,
          13
        ],
        "charge": [
          14,
          15,
          16,
          17
        ]
      },
      "w": 312,
      "h": 332,
      "feetY": 286,
      "anchorX": 172
    },
    "shot": {
      "file": "assets/kaioken_shot.png",
      "texture": "kaioken_shot",
      "frames": {
        "hold": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "small": [
          8,
          9,
          10
        ]
      },
      "w": 212,
      "h": 236,
      "feetY": 227,
      "anchorX": 90,
      "ball": {
        "small": {
          "dx": 138.8,
          "dy": 91.0
        },
        "big": {
          "dx": 49.7,
          "dy": 98.8
        }
      }
    }
  }
};
