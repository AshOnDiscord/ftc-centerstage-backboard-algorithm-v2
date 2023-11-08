class Board {
  public pixels: Pixel[][] = [];
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
    for (let i = Color.empty; i < Color.purple; i++) {
      count[i] = colors.filter((e) => e?.color == i).length;
    }
    return count;
  };
}

const board = new Board();
board.loadString("gc/ y");
board.printBoard();
board.findMosaics().forEach((mosaic) => {
  console.log(mosaic.map((e) => ColorEscape[Color[e.color]] + `(${e.y}, ${e.x})` + ColorEscape.reset).join(" "));
});
// while (true) {
//   board.printBoard();
//   const y = prompt("y:") as string;
//   const x = prompt("x:") as string;
//   const color = prompt("color:") as string;
//   board.pixels[parseInt(y)][parseInt(x)].color = Color[color];
// }
