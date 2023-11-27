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
        if (pixel.color === Color.empty || checked.includes(pixel)) continue;
        checked.push(pixel);
        const same = pixel.getNeighbors(NeighborType.same).filter((e) => e);
        const diff = pixel.getNeighbors(NeighborType.differentColor).filter((e) => e);
        let mixed = false;
        if (diff.filter((e) => e?.color !== Color.colored).length !== 0) {
          if (diff.length !== 2 && same.filter((e) => e?.color !== Color.colored).length == 0) continue;
          mixed = true;
        } else if (same.length !== 2) continue;
        const n1 = (mixed ? diff : same)[0] as Pixel;
        const n2 = (mixed ? diff : same)[1] as Pixel;
        checked.push(n1);
        checked.push(n2);
        if (
          n1
            .getNeighbors(n1.color === Color.colored ? NeighborType.none : mixed ? NeighborType.same : NeighborType.differentColor)
            .filter((e) => e && e.color !== Color.colored).length !== 0
        ) {
          continue;
        }
        if (
          n2
            .getNeighbors(n2.color === Color.colored ? NeighborType.none : mixed ? NeighborType.same : NeighborType.differentColor)
            .filter((e) => e && e.color !== Color.colored).length !== 0
        )
          continue;
        const n1Same = n1.getNeighbors(mixed ? NeighborType.different : NeighborType.same);
        const n2Same = n2.getNeighbors(mixed ? NeighborType.different : NeighborType.same);
        if (n1Same.filter((e) => e).length !== 2) continue;
        if (n2Same.filter((e) => e).length !== 2) continue;
        if (!n1Same.find((e) => e == n2)) continue;
        mosaics.push([pixel, n1, n2]);
      }
    }
    return mosaics;
  };

  public coloredColor = (mosaics: Pixel[][]): PixelData[] => {
    // return the colors that the color.colored should change to
    const newColors: PixelData[] = [];
    const checked: Pixel[] = [];
    for (const mosaic of mosaics) {
      for (const pixel of mosaic) {
        if (pixel.color != Color.colored) continue;
        if (checked.includes(pixel)) continue;
        checked.push(pixel);
        const touching = pixel.getTouchingColors();
        const otherPixels = mosaic.filter((e) => e != pixel);
        if (otherPixels[0].color == Color.colored && otherPixels[1].color == Color.colored) {
          // all colored
          let mostColor = Color.white;
          let mostCount = 0;
          for (let i = Color.yellow; i <= Color.green; i++) {
            if (this.limits[i] > mostCount) {
              mostColor = i;
              mostCount = this.limits[i];
            }
          }
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: mostColor });
          newColors.push({ x: otherPixels[0].x, y: otherPixels[0].y, color: mostColor });
          newColors.push({ x: otherPixels[1].x, y: otherPixels[1].y, color: mostColor });
        } else if (otherPixels[0].color == Color.colored) {
          // 1 is a real color
          const otherColor = otherPixels[1].color;
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: otherColor });
          newColors.push({ x: otherPixels[0].x, y: otherPixels[0].y, color: otherColor });
        } else if (otherPixels[1].color == Color.colored) {
          // 0 is a real color
          const otherColor = otherPixels[0].color;
          checked.push(otherPixels[0]);
          checked.push(otherPixels[1]);
          newColors.push({ x: pixel.x, y: pixel.y, color: otherColor });
          newColors.push({ x: otherPixels[1].x, y: otherPixels[1].y, color: otherColor });
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

  getNeightbor(direction: Direction): Pixel | null {
    const offset = this.offsets[direction];
    return this.board.pixels[this.x + offset[0]]?.[this.y + offset[1]];
  }

  getNeighbors(type: NeighborType = NeighborType.all): (Pixel | null)[] {
    if (type == NeighborType.none) return [null, null, null, null, null, null];
    const neighbors = this.offsets.map((offset, i) => {
      const pixel = this.board.pixels[this.y + offset[0]]?.[this.x + offset[1]];
      if (!pixel || pixel.color === Color.empty) return null;
      if (type == NeighborType.all || this.color == Color.colored) {
        return pixel;
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

const board = new Board();
board.loadString("yg/ c");
board.printBoard();
const mosaics = board.findMosaics();
mosaics.forEach((mosaic) => {
  console.log(mosaic.map((e) => ColorEscape[Color[e.color]] + `(${e.y}, ${e.x})` + ColorEscape.reset).join(" "));
});
const newColors = board.coloredColor(mosaics);
newColors.forEach((e) => {
  console.log(`(${e.y}, ${e.x}) = ${Color[e.color]}`);
  board.pixels[e.y][e.x].color = e.color;
});
board.printBoard();
// while (true) {
//   board.printBoard();
//   const y = prompt("y:") as string;
//   const x = prompt("x:") as string;
//   const color = prompt("color:") as string;
//   board.pixels[parseInt(y)][parseInt(x)].color = Color[color];
// }
