// GERADO por tools/slice_forms.py - não edite à mão.
export interface SheetInfo {
  file: string;
  texture: string;
  /** tamanho da célula (px do frame) */
  w: number;
  h: number;
  /** distância do topo da célula até os pés */
  feetY: number;
  frames: Record<string, number[]>;
}
export interface BodySheet extends SheetInfo {
  frames: Record<'idle' | 'walk_right' | 'walk_left' | 'run_right' | 'run_left' | 'air', number[]>;
}
export interface AuraSheet extends SheetInfo {
  frames: Record<'aura' | 'transform', number[]>;
}

export type FormId = 'normal' | 'ssj' | 'kaioken';

export const FORM_SHEETS: Record<FormId, { body: BodySheet; aura: AuraSheet | null }> = {
  "normal": {
    "body": {
      "file": "assets/normal.png",
      "texture": "normal",
      "w": 234,
      "h": 246,
      "feetY": 238,
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
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18
        ],
        "walk_left": [
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29
        ],
        "run_right": [
          33,
          34,
          35,
          36,
          37,
          38,
          39,
          40,
          41,
          42
        ],
        "run_left": [
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51,
          52,
          53
        ],
        "air": [
          55,
          56,
          57,
          58,
          59,
          60,
          61,
          62,
          63,
          64,
          65
        ]
      }
    },
    "aura": null
  },
  "ssj": {
    "body": {
      "file": "assets/ssj.png",
      "texture": "ssj",
      "w": 210,
      "h": 260,
      "feetY": 251,
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
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15
        ],
        "walk_left": [
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23
        ],
        "run_right": [
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31
        ],
        "run_left": [
          32,
          33,
          34,
          35,
          36,
          37,
          38,
          39
        ],
        "air": [
          40,
          41,
          42,
          43,
          44,
          45
        ]
      }
    },
    "aura": {
      "file": "assets/ssj_aura.png",
      "texture": "ssj_aura",
      "w": 326,
      "h": 333,
      "feetY": 314,
      "frames": {
        "aura": [
          0,
          1,
          2,
          3,
          4
        ],
        "transform": [
          6,
          7,
          8,
          9,
          10,
          11
        ]
      }
    }
  },
  "kaioken": {
    "body": {
      "file": "assets/kaioken.png",
      "texture": "kaioken",
      "w": 280,
      "h": 318,
      "feetY": 266,
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
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15
        ],
        "walk_left": [
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23
        ],
        "run_right": [
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31
        ],
        "run_left": [
          32,
          33,
          34,
          35,
          36,
          37,
          38,
          39
        ],
        "air": [
          40,
          41,
          42,
          43,
          44,
          45
        ]
      }
    },
    "aura": {
      "file": "assets/kaioken_aura.png",
      "texture": "kaioken_aura",
      "w": 362,
      "h": 331,
      "feetY": 309,
      "frames": {
        "aura": [
          0,
          1,
          2,
          3,
          4
        ],
        "transform": [
          6,
          7,
          8,
          9,
          10,
          11
        ]
      }
    }
  }
};
