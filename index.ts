class Board {
  public pixels: Pixel[][] = [];
  public limits: number[] = [Infinity, Infinity, 10, 10, 10, 30];

  constructor() {
    this.setup();
  }

  public setup() {
    for (let i = 0; i < 11; i++) {
      this.pixels.push([]);
      for (let j = 0; j < 6 + (i % 2); j++) {
        this.pixels[i].push(new Pixel(this, i, j));
      }
    }
  }

  public loadString = (str: string) => {
    let row = 0;
    let col = 0;
    outerLoop: for (let i = 0; i < str.length; i++) {
      switch (str[i]) {
        case "w":
          this.pixels[row][col].color = Color.white;
          break;
        case "y":
          this.pixels[row][col].color = Color.yellow;
          break;
        case "g":
          this.pixels[row][col].color = Color.green;
          break;
        case "p":
          this.pixels[row][col].color = Color.purple;
          break;
        case "c":
          this.pixels[row][col].color = Color.colored;
          break;
        case "/":
          row++;
          col = 0;
          continue outerLoop;
      }
      col++;
      if (col >= this.pixels[row].length) {
        row++;
        col = 0;
      }
      if (row >= this.pixels.length) {
        console.error("Board is too small for string");
        console.error("Remaining string: " + str.slice(i));
        break;
      }
    }
  };

  public printBoard() {
    this.pixels
      .slice()
      .reverse()
      .forEach((row) => {
        let line = row.length % 2 === 0 ? " " : "";
        row.forEach((pixel) => {
          if (pixel.color === Color.empty) {
            line += "- ";
            return;
          }
          line += ColorEscape[Color[pixel.color]] + pixel.getNeighbors(NeighborType.same).filter((e) => e).length + " " + ColorEscape.empty;
        });
        console.log(line);
      });
  }

  public findMosaics = (): Pixel[][] => {
    const checked: Pixel[] = [];
    const mosaics: Pixel[][] = [];
    for (let y = 0; y < this.pixels.length; y++) {
      for (let x = 0; x < this.pixels[y].length; x++) {
        const pixel = this.pixels[y][x];
        if (pixel.color === Color.empty || pixel.color === Color.white || checked.includes(pixel)) continue;
        checked.push(pixel);
        const coloredNeighbors = pixel.getNeighbors(NeighborType.colored).filter((e) => e) as Pixel[];
        coloredNeighbors.forEach((e) => checked.push(e));
        if (coloredNeighbors.length !== 2) {
          // we have too little or too many colored neighbors, skip
          // by extension, the neighbors are also invalid so we can skip them
          // coloredNeighbors.forEach((e) => checked.push(e));
          continue;
        }
        // check our neighbors, do they also have only two colored neighbors?
        const n1 = coloredNeighbors[0].getNeighbors(NeighborType.colored).filter((e) => e) as Pixel[];
        const n2 = coloredNeighbors[1].getNeighbors(NeighborType.colored).filter((e) => e) as Pixel[];
        if (n1.length !== 2 || n2.length !== 2) {
          // we have too little or too many colored neighbors, skip
          // by extension, the neighbors are also invalid so we can skip them
          // coloredNeighbors.forEach((e) => checked.push(e));
          n1.forEach((e) => checked.push(e));
          n2.forEach((e) => checked.push(e));
          continue;
        }

        // make sure the neighbors are the same(so n1 is current and neighbor2, n2 is current and neighbor1)
        if (!n1.includes(coloredNeighbors[1]) || !n2.includes(coloredNeighbors[0])) {
          // they are not the same
          // coloredNeighbors.forEach((e) => checked.push(e));
          n1.forEach((e) => checked.push(e));
          n2.forEach((e) => checked.push(e));
          continue;
        }

        // we have two colored neighbors, just have to make sure its valid configuration
        // first we check for all same color
        const sameColor = coloredNeighbors.filter((e) => e.color === pixel.color || e.color === Color.colored);
        if (sameColor.length !== 2) {
          // if we don't have two of the same we have to check for multi/mixed mosaic
          const color1 = coloredNeighbors[0].color;
          const color2 = coloredNeighbors[1].color;
          const mixedColors = this.getOtherColors(pixel.color);
          // if we are colored, then if one our neighbors is colored, then we have a same or mixed mosaic(to be determined later)
          if (pixel.color === Color.colored && (color1 === Color.colored || color2 === Color.colored)) {
            mosaics.push([pixel, ...coloredNeighbors]);
            continue;
          }

          // try color1 = colored
          if (color1 === Color.colored && mixedColors.includes(color2)) {
            // we have a mixed mosaic
            mosaics.push([pixel, ...coloredNeighbors]);
            continue;
          }
          // try color2 = colored
          if (color2 === Color.colored && mixedColors.includes(color1)) {
            // we have a mixed mosaic
            mosaics.push([pixel, ...coloredNeighbors]);
            continue;
          }
          // try color1 = mixedColors[0]
          if (color1 === mixedColors[0] && color2 === mixedColors[1]) {
            // we have a mixed mosaic
            mosaics.push([pixel, ...coloredNeighbors]);
            continue;
          }
          // try color1 = mixedColors[1]
          if (color1 === mixedColors[1] && color2 === mixedColors[0]) {
            // we have a mixed mosaic
            mosaics.push([pixel, ...coloredNeighbors]);
            continue;
          }
        } else {
          // otherwise we have two of the same color
          mosaics.push([pixel, ...sameColor]);
        }
      }
    }
    return mosaics;
  };

  public getColorCount = (): number[] => {
    const count: number[] = [];
    for (let i = Color.white; i < Color.colored; i++) {
      count[i] = 0;
    }
    for (const row of this.pixels) {
      for (const pixel of row) {
        if (pixel.color == Color.colored) continue;
        count[pixel.color]++;
      }
    }
    return count;
  };

  public getRemaining = (color: Color, coloredCount: number[]) => {
    return this.limits[color] - coloredCount[color];
  };

  public getOtherColors = (color: Color): Color[] => {
    const colors: Color[] = [];
    switch (color) {
      case Color.yellow:
        colors.push(Color.green);
        colors.push(Color.purple);
        break;
      case Color.green:
        colors.push(Color.yellow);
        colors.push(Color.purple);
        break;
      case Color.purple:
        colors.push(Color.yellow);
        colors.push(Color.green);
        break;
    }
    return colors;
  };

  public coloredColor = (mosaics: Pixel[][]): PixelData[] => {
    // return the colors that the color.colored should change to
    const newColors: PixelData[] = [];
    const checked: Pixel[] = [];
    const coloredCount = this.getColorCount();
    for (const mosaic of mosaics) {
      for (const pixel of mosaic) {
        if (pixel.color !== Color.colored) continue;
        if (checked.includes(pixel)) continue;
        checked.push(pixel);
        const touching = pixel.getTouchingColors();
        const otherPixels = mosaic.filter((e) => e != pixel);
        let mostColor = Color.white;
        let mostCount = 0;
        for (let i = Color.yellow; i <= Color.green; i++) {
          if (this.getRemaining(i, coloredCount) > mostCount) {
            mostColor = i;
            mostCount = this.limits[i];
          }
        }
        console.log(mostColor);
        if (otherPixels[0].color == Color.colored && otherPixels[1].color == Color.colored) {
          // all colored
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: mostColor });
          newColors.push({ x: otherPixels[0].x, y: otherPixels[0].y, color: mostColor });
          newColors.push({ x: otherPixels[1].x, y: otherPixels[1].y, color: mostColor });
        } else if (otherPixels[0].color == Color.colored) {
          // 1 is a real color
          const otherColor = otherPixels[1].color;
          let colors = [otherColor, otherColor];
          if (this.getRemaining(otherColor, coloredCount) < 2) {
            // we have to resort to mixed mosaic
            colors = this.getOtherColors(otherColor);
            if (this.getRemaining(colors[0], coloredCount) < 1 || this.getRemaining(colors[0], coloredCount)) {
              // we don't have enough for a mixed mosaic,
              // abort to whites
              colors = [Color.white, Color.white];
            }
          }
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: colors[0] });
          newColors.push({ x: otherPixels[0].x, y: otherPixels[0].y, color: colors[1] });
        } else if (otherPixels[1].color == Color.colored) {
          // 0 is a real color
          const otherColor = otherPixels[0].color;
          let colors: Color[] = [otherColor, otherColor];
          if (this.getRemaining(otherColor, coloredCount) < 2) {
            // we have to resort to mixed mosaic
            colors = this.getOtherColors(otherColor);
            if (this.getRemaining(colors[0], coloredCount) < 1 || this.getRemaining(colors[1], coloredCount) < 1) {
              // we don't have enough for a mixed mosaic,
              // abort to whites
              colors = [Color.white, Color.white];
            }
          }
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: colors[0] });
          newColors.push({ x: otherPixels[1].x, y: otherPixels[1].y, color: colors[1] });
        } else {
          // both are real colors
          const c1 = otherPixels[0].color;
          const c0 = otherPixels[1].color;
          if (c0 == c1) {
            newColors.push({ x: pixel.x, y: pixel.y, color: c0 });
          } else {
            if (![c0, c1].includes(Color.yellow)) {
              // green and purple
              newColors.push({ x: pixel.x, y: pixel.y, color: Color.yellow });
            } else if (![c0, c1].includes(Color.green)) {
              // yellow and purple
              newColors.push({ x: pixel.x, y: pixel.y, color: Color.green });
            } else {
              // yellow and green
              newColors.push({ x: pixel.x, y: pixel.y, color: Color.purple });
            }
          }
        }
      }
    }
    return newColors;
  };

  public hash(): string {
    // Preallocate the key for better performance
    const keyArray: number[] = new Array(this.pixels.length * this.pixels[0].length);

    let index = 0;
    for (let i = 0; i < this.pixels.length; i++) {
      for (let j = 0; j < this.pixels[i].length; j++) {
        keyArray[index] = this.pixels[i][j].color;
        index++;
      }
    }

    return keyArray.join("");
  }

  public getLines() {
    let lines = 0;
    for (let i = 2; i < this.pixels.length; i += 3) {
      if (this.pixels[i].filter((p) => p.color !== Color.empty).length === 0) break; // since its bottom up, we can early exit if we have a empty row
      lines++;
    }
    return lines;
  }

  public getScore() {
    let score = 0;
    for (let i = 0; i < this.pixels.length; i++) {
      for (let j = 0; j < this.pixels[i].length; j++) {
        const p = this.pixels[i][j];
        if (p.color !== Color.empty) score += 3;
      }
    }
    const mosaics = this.findMosaics();
    score += mosaics.length * 10;
    const lines = this.getLines();
    score += lines * 10;
    return score;
  }

  public copy() {
    const copy = new Board();
    copy.pixels = this.pixels.map((row) => row.map((p) => new Pixel(copy, p.y, p.x, p.color)));
    return copy;
  }

  public getMoves() {
    // go from top to bottom for each column
    const moves: Pixel[] = [];
    // }
    for (let i = this.pixels.length - 1; i >= 0; i--) {
      for (let j = 0; j < this.pixels[i].length; j++) {
        const pixel = this.pixels[i][j];
        // if (pixel.color == Color.empty) continue;
        if (pixel.color !== Color.empty) continue; // skip if not empty
        {
          // check if pixels covering it
          const tL = pixel.getNeighbor(Direction.topLeft);
          if (tL && tL.color !== Color.empty) {
            // console.log("tL", { x: tL.x, y: tL.y, color: Color[tL.color] }, { x: pixel.x, y: pixel.y, color: Color[pixel.color] });
            continue;
          }
          const tR = pixel.getNeighbor(Direction.topRight);
          if (tR && tR.color !== Color.empty) {
            // console.log("tR", { x: tR.x, y: tR.y, color: Color[tR.color] }, { x: pixel.x, y: pixel.y, color: Color[pixel.color] });
            continue;
          }
        }
        {
          // check if the pixel has proper supports
          const bL = pixel.getNeighbor(Direction.bottomLeft);
          const bR = pixel.getNeighbor(Direction.bottomRight);
          if (bL && bL.color === Color.empty) {
            // missing left support
            continue;
          }
          if (bR && bR.color === Color.empty) {
            // missing right support
            continue;
          }
          if (!bL && bR?.color === Color.empty) continue; // against left wall, missing right pixel
          if (!bR && bL?.color === Color.empty) continue; // against right wall, missing left pixel
        }
        moves.push(pixel);
      }
    }
    return moves;
  }
}

enum ColorEscape {
  empty = "\x1b[0m",
  white = "\x1b[38;2;255;255;255m",
  yellow = "\x1b[38;2;255;196;96m",
  purple = "\x1b[38;2;255;96;196m",
  green = "\x1b[38;2;96;255;96m",
  colored = "\x1b[38;2;0;255;255m",
  reset = "\x1b[0m",
}

enum Color {
  empty,
  white,
  yellow,
  purple,
  green,
  colored,
}

enum Direction {
  topLeft,
  topRight,
  right,
  bottomRight,
  bottomLeft,
  left,
}

enum NeighborType {
  none,
  all,
  same,
  different,
  differentColor,
  colored,
}

interface PixelData {
  x: number;
  y: number;
  color: Color;
}

class Pixel {
  public offsets: number[][];
  constructor(public board: Board, public y: number, public x: number, public color: Color = Color.empty) {
    if (y % 2 === 0) {
      this.offsets = [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [0, -1],
      ];
    } else {
      this.offsets = [
        [1, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
      ];
    }
  }

  getNeighbor(direction: Direction): Pixel | null {
    const offset = this.offsets[direction];
    // console.log(offset);
    return this.board.pixels[this.y + offset[0]]?.[this.x + offset[1]];
  }

  getNeighbors(type: NeighborType = NeighborType.all): (Pixel | null)[] {
    if (type == NeighborType.none) return [null, null, null, null, null, null];
    const neighbors = this.offsets.map((offset, i) => {
      let pixel = this.board.pixels[this.y + offset[0]] ? this.board.pixels[this.y + offset[0]][this.x + offset[1]] : null;
      if (!pixel || pixel.color === Color.empty) return null;
      if (type == NeighborType.all) {
        return pixel;
      } else if (type == NeighborType.colored || this.color == Color.colored) {
        return pixel?.color !== Color.white ? pixel : null;
      } else if (type == NeighborType.same) {
        return pixel?.color == this.color || pixel.color == Color.colored ? pixel : null;
      } else if (type == NeighborType.different) {
        return pixel?.color != this.color ? pixel : null;
      } else if (type == NeighborType.differentColor) {
        return pixel?.color != this.color && pixel?.color != Color.white ? pixel : null;
      }
      return null;
    });
    return neighbors;
  }

  getTouchingColors = (): number[] => {
    const colors = this.getNeighbors(NeighborType.all);
    const count: number[] = [];
    for (let i = Color.empty; i < Color.colored; i++) {
      count[i] = colors.filter((e) => e?.color == i).length;
    }
    return count;
  };
}

interface Branch {
  score: number;
  history: PixelData[];
}

const getHighestScore = (board: Board, depth: number, history: PixelData[], transpositionTable: Map<string, Branch>): Branch => {
  const boardKey = board.hash();

  if (transpositionTable.has(boardKey)) {
    return transpositionTable.get(boardKey) as Branch;
  }

  if (depth == 0) {
    return { score: board.getScore(), history };
  }
  const moves = board.getMoves().map((e) => ({ x: e.x, y: e.y, color: Color[e.color] }));
  let maxScore: Branch = { score: -Infinity, history: [] };
  moves.forEach((move) => {
    for (let color of [Color.white, Color.colored]) {
      board.pixels[move.y][move.x].color = color;
      const score = getHighestScore(board, depth - 1, [...history, { x: move.x, y: move.y, color: color }], transpositionTable);
      board.pixels[move.y][move.x].color = Color.empty;
      if (score.score > maxScore.score) {
        maxScore = score;
      }
    }
  });
  transpositionTable.set(boardKey, maxScore);
  return maxScore;
};

const board = new Board();
board.loadString("");
board.printBoard();
console.log();

const start = Date.now();
const topScore = getHighestScore(board, 8, [], new Map());
const end = Date.now();
console.log("Top", topScore.score);
console.log("Time:", end - start);

const newBoard = board.copy();
topScore.history.forEach((e) => {
  newBoard.pixels[e.y][e.x].color = e.color;
});
const mosaics = newBoard.findMosaics();
mosaics.forEach((mosaic) => {
  console.log(mosaic.map((e) => ColorEscape[Color[e.color]] + `(${e.y}, ${e.x})` + ColorEscape.reset).join(" "));
});
const newColors = newBoard.coloredColor(mosaics);
newColors.forEach((e) => {
  console.log(`(${e.y}, ${e.x}) = ${Color[e.color]}`);
  newBoard.pixels[e.y][e.x].color = e.color;
});
newBoard.printBoard();

// const mosaics = board.findMosaics();
// mosaics.forEach((mosaic) => {
//   console.log(mosaic.map((e) => ColorEscape[Color[e.color]] + `(${e.y}, ${e.x})` + ColorEscape.reset).join(" "));
// });
// const newColors = board.coloredColor(mosaics);
// newColors.forEach((e) => {
//   console.log(`(${e.y}, ${e.x}) = ${Color[e.color]}`);
//   board.pixels[e.y][e.x].color = e.color;
// });
// board.printBoard();
// // while (true) {
// //   board.printBoard();
// //   const y = prompt("y:") as string;
// //   const x = prompt("x:") as string;
// //   const color = prompt("color:") as string;
// //   board.pixels[parseInt(y)][parseInt(x)].color = Color[color];
// // }
