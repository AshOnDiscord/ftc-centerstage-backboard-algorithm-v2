import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

public class Main {
  public static void main(String[] args) {
    // wait 1s
//    try {
//      TimeUnit.SECONDS.sleep(3);
//    } catch (InterruptedException e) {
//      // TODO Auto-generated catch block
//      e.printStackTrace();
//    }

    Board board = new Board();
    board.loadString("  gy");
    board.printBoard();
    System.out.println();
    // ArrayList<PixelData> moves = board.getMoves().stream().map(e -> new PixelData(e.x, e.y, e.color))
    //     .collect(Collectors.toCollection(ArrayList<PixelData>::new));

    // moves.forEach((e) -> {
    //   System.out.println(e);
    // });
    long start = System.currentTimeMillis();
    Branch topScore = getHighestScore.calc(board, 8, new ArrayList<>(), new HashMap<>());
    long end = System.currentTimeMillis();
    System.out.println("Top: " + topScore.score);
    System.out.println("Time: " + (end - start));

    Board newBoard = board.copy();
    topScore.history.forEach((e) -> {
      newBoard.pixels.get(e.y).get(e.x).color = e.color;
      // System.out.println(e);
    });
    ArrayList<Pixel[]> mosaics = newBoard.findMosaics();
    mosaics.forEach(mosaic -> {
      StringBuilder line = new StringBuilder();
      for (Pixel pixel : mosaic) {
        line.append(ColorEscape.getColor(pixel.color));
        line.append("(");
        line.append(pixel.y);
        line.append(", ");
        line.append(pixel.x);
        line.append(")");
        line.append(ColorEscape.empty);
        line.append(" ");
      }
      System.out.println(line);
    });
    ArrayList<PixelData> newColors = newBoard.coloredColor(mosaics);
    newColors.forEach((e) -> {
      System.out.println(e);
      newBoard.pixels.get(e.y).get(e.x).color = e.color;
    });
    newBoard.printBoard();
  }
}

class Board {
  public ArrayList<ArrayList<Pixel>> pixels = new ArrayList<>();
  public int[] limits = { Integer.MAX_VALUE, Integer.MAX_VALUE, 10, 10, 10, 30 };

  public Board() {
    this.setup();
  }

  public void setup() {
    for (int i = 0; i < 11; i++) {
      this.pixels.add(new ArrayList<>());
      for (int j = 0; j < 6 + (i % 2); j++) {
        this.pixels.get(i).add(new Pixel(this, i, j));
      }
    }
  }

  public void loadString(String str) {
    int row = 0;
    int col = 0;
    for (int i = 0; i < str.length(); i++) {
      switch (str.charAt(i)) {
        case 'w':
          this.pixels.get(row).get(col).color = Color.white;
          break;
        case 'y':
          this.pixels.get(row).get(col).color = Color.yellow;
          break;
        case 'g':
          this.pixels.get(row).get(col).color = Color.green;
          break;
        case 'p':
          this.pixels.get(row).get(col).color = Color.purple;
          break;
        case 'c':
          this.pixels.get(row).get(col).color = Color.colored;
          break;
        case '/':
          row++;
          col = 0;
          continue;
      }
      col++;
      if (col >= this.pixels.get(row).size()) {
        row++;
        col = 0;
      }
      if (row >= this.pixels.size()) {
        System.out.println("Board is too small for string");
        System.out.println("Remaining string: " + str.substring(i));
        break;
      }
    }
  }

  // public printBoard() {
  // this.pixels
  // .slice()
  // .reverse()
  // .forEach((row) => {
  // let line = row.length % 2 == 0 ? " " : "";
  // row.forEach((pixel) => {
  // if (pixel.color == Color.empty) {
  // line += "- ";
  // return;
  // }
  // line += ColorEscape[Color[pixel.color]] +
  // pixel.getNeighbors(NeighborType.same).filter((e) => e).length + " " +
  // ColorEscape.empty;
  // });
  // System.out.println(line);
  // });
  // }

  public void printBoard() {
    ArrayList<PixelData> moves = this.getMoves().stream().map(e -> new PixelData(e.y, e.x, e.color))
        .collect(Collectors.toCollection(ArrayList<PixelData>::new));

    for (int i = this.pixels.size() - 1; i >= 0; i--) {
      ArrayList<Pixel> row = this.pixels.get(i);
      StringBuilder line = new StringBuilder(row.size() % 2 == 0 ? " " : "");
      // row.forEach(pixel -> {
      for (Pixel pixel : row) {
        if (moves.stream().anyMatch(e -> e.x == pixel.x && e.y == pixel.y)) {
          line.append(ColorEscape.getColor(pixel.color));
          line.append("X ");
          line.append(ColorEscape.empty);
          continue;
        }
        if (pixel.color == Color.empty) {
          line.append("- ");
          continue;
        }
        line.append(ColorEscape.getColor(pixel.color));
        Pixel[] neighbors = pixel.getNeighbors(NeighborType.same);
        int count = 0;
        for (Pixel neighbor : neighbors) {
          if (neighbor != null)
            count++;
        }
        line.append(count);
        line.append(" " + ColorEscape.empty);
      }
      // });
      System.out.println(line);
    }
  }

  public ArrayList<Pixel[]> findMosaics() {
    ArrayList<Pixel> checked = new ArrayList<>();
    ArrayList<Pixel[]> mosaics = new ArrayList<>();
      for (ArrayList<Pixel> pixelArrayList : this.pixels) {
          for (Pixel pixel : pixelArrayList) {
              if (pixel.color == Color.empty || pixel.color == Color.white || checked.contains(pixel))
                  continue;
              checked.add(pixel);
              ArrayList<Pixel> coloredNeighbors = Arrays.stream(pixel.getNeighbors(NeighborType.colored))
                      .filter(Objects::nonNull).collect(Collectors.toCollection(ArrayList::new));
            checked.addAll(coloredNeighbors);
              if (coloredNeighbors.size() != 2) {
                  // we have too little or too many colored neighbors, skip
                  // by extension, the neighbors are also invalid, so we can skip them
                  continue;
              }
              // check our neighbors, do they also have only two colored neighbors?
              ArrayList<Pixel> n1 = Arrays.stream(coloredNeighbors.get(0).getNeighbors(NeighborType.colored))
                      .filter(Objects::nonNull).collect(Collectors.toCollection(ArrayList::new));
              ArrayList<Pixel> n2 = Arrays.stream(coloredNeighbors.get(1).getNeighbors(NeighborType.colored))
                      .filter(Objects::nonNull).collect(Collectors.toCollection(ArrayList::new));
              if (n1.size() != 2 || n2.size() != 2) {
                  // we have too little or too many colored neighbors, skip
                  // by extension, the neighbors are also invalid, so we can skip them
                  // coloredNeighbors.forEach((e) => checked.add(e));
                checked.addAll(n1);
                checked.addAll(n2);
                  continue;
              }

              // make sure the neighbors are the same(so n1 is current and neighbor2, n2 is
              // current and neighbor1)
              if (!n1.contains(coloredNeighbors.get(1)) || !n2.contains(coloredNeighbors.get(0))) {
                  // they are not the same
                  // coloredNeighbors.forEach((e) => checked.add(e));
                checked.addAll(n1);
                checked.addAll(n2);
                  continue;
              }

              // we have two colored neighbors, just have to make sure its valid configuration
              // first we check for all same color
              ArrayList<Pixel> sameColor = coloredNeighbors.stream()
                      .filter(e -> e.color == pixel.color || e.color == Color.colored)
                      .collect(Collectors.toCollection(ArrayList::new));
              if (sameColor.size() != 2) {
                  // if we don't have two of the same we have to check for multi/mixed mosaic
                  Color color1 = coloredNeighbors.get(0).color;
                  Color color2 = coloredNeighbors.get(1).color;
                  Color[] mixedColors = this.getOtherColors(pixel.color);
                  // if we are colored, then if one our neighbors is colored, then we have a same
                  // or mixed mosaic(to be determined later)
                  if (pixel.color == Color.colored && (color1 == Color.colored || color2 == Color.colored)) {
                      // mosaics.add([pixel, ...coloredNeighbors]);
                      mosaics.add(new Pixel[]{pixel, coloredNeighbors.get(0), coloredNeighbors.get(1)});
                      continue;
                  }

                  // try color1 = colored
                  if (color1 == Color.colored && Arrays.asList(mixedColors).contains(color2)) {
                      // we have a mixed mosaic
                      mosaics.add(new Pixel[]{pixel, coloredNeighbors.get(0), coloredNeighbors.get(1)});
                      continue;
                  }
                  // try color2 = colored
                  if (color2 == Color.colored && Arrays.asList(mixedColors).contains(color1)) {
                      // we have a mixed mosaic
                      mosaics.add(new Pixel[]{pixel, coloredNeighbors.get(0), coloredNeighbors.get(1)});
                      continue;
                  }
                  // try color1 = mixedColors[0]
                  if (color1 == mixedColors[0] && color2 == mixedColors[1]) {
                      // we have a mixed mosaic
                      mosaics.add(new Pixel[]{pixel, coloredNeighbors.get(0), coloredNeighbors.get(1)});
                      continue;
                  }
                  // try color1 = mixedColors[1]
                  if (color1 == mixedColors[1] && color2 == mixedColors[0]) {
                      // we have a mixed mosaic
                      mosaics.add(new Pixel[]{pixel, coloredNeighbors.get(0), coloredNeighbors.get(1)});
                  }
              } else {
                  // otherwise we have two of the same color
                  mosaics.add(new Pixel[]{pixel, sameColor.get(0), sameColor.get(1)});
              }
          }
      }
    return mosaics;
  }

  public int[] getColorCount() {
    int[] count = new int[Color.colored.val];
    for (int i = Color.white.val; i < Color.colored.val; i++) {
      count[i] = 0;
    }
    for (ArrayList<Pixel> row : this.pixels) {
      for (Pixel pixel : row) {
        if (pixel.color == Color.colored)
          continue;
        count[pixel.color.val]++;
      }
    }
    return count;
  }

  public int getRemaining(Color color, int[] coloredCount) {
    return this.limits[color.val] - coloredCount[color.val];
  }

  public Color[] getOtherColors(Color color) {
    Color[] colors;
    switch (color) {
      case yellow -> {
        colors = new Color[] { Color.green, Color.purple };
      }
      case green -> {
        colors = new Color[] { Color.yellow, Color.purple };
      }
      case purple -> {
        colors = new Color[] { Color.yellow, Color.green };
      }
      default -> {
        colors = new Color[] { Color.white, Color.white };
      }
    }
    return colors;
  }

  public ArrayList<PixelData> coloredColor(ArrayList<Pixel[]> mosaics) {
    // return the colors that the color.colored should change to
    ArrayList<PixelData> newColors = new ArrayList<>();
    ArrayList<Pixel> checked = new ArrayList<>();
    int[] coloredCount = this.getColorCount();
    for (Pixel[] mosaic : mosaics) {
      for (Pixel pixel : mosaic) {
        if (pixel.color != Color.colored)
          continue;
        if (checked.contains(pixel))
          continue;
        checked.add(pixel);
        // int[] touching = pixel.getTouchingColors();
        Pixel[] otherPixels = Arrays.stream(mosaic).filter(e -> e != pixel).toArray(Pixel[]::new);
        Color mostColor = Color.white;
        int mostCount = 0;
        for (int i = Color.yellow.val; i <= Color.green.val; i++) {
            if (this.getRemaining(Color.fromInt(i), coloredCount) > mostCount) {
            mostColor = Color.fromInt(i);
            mostCount = this.limits[i];
          }
        }
        // System.out.println(mostColor);
        if (otherPixels[0].color == Color.colored && otherPixels[1].color == Color.colored) {
          // all colored
          checked.add(otherPixels[0]);
          checked.add(otherPixels[1]);
          newColors.add(new PixelData(pixel.y, pixel.x, mostColor));
          newColors.add(new PixelData(otherPixels[0].y, otherPixels[0].x, mostColor));
          newColors.add(new PixelData(otherPixels[1].y, otherPixels[1].x, mostColor));
        } else if (otherPixels[0].color == Color.colored) {
          // 1 is a real color
          Color otherColor = otherPixels[1].color;
          Color[] colors = { otherColor, otherColor };
          if (this.getRemaining(otherColor, coloredCount) < 2) {
            // we have to resort to mixed mosaic
            colors = this.getOtherColors(otherColor);
            if (this.getRemaining(colors[0], coloredCount) < 1 || this.getRemaining(colors[1], coloredCount) < 1) {
              // we don't have enough for a mixed mosaic,
              // abort to whites
              colors = new Color[] { Color.white, Color.white };
            }
          }
          checked.add(otherPixels[0]);
          checked.add(otherPixels[1]);
          newColors.add(new PixelData(pixel.y, pixel.x, colors[0]));
          newColors.add(new PixelData(otherPixels[0].y, otherPixels[0].x, colors[1]));
        } else if (otherPixels[1].color == Color.colored) {
          // 0 is a real color
          Color otherColor = otherPixels[0].color;
          Color[] colors = { otherColor, otherColor };
          if (this.getRemaining(otherColor, coloredCount) < 2) {
            // we have to resort to mixed mosaic
            colors = this.getOtherColors(otherColor);
            if (this.getRemaining(colors[0], coloredCount) < 1 || this.getRemaining(colors[1], coloredCount) < 1) {
              // we don't have enough for a mixed mosaic,
              // abort to whites
              colors = new Color[] { Color.white, Color.white };
            }
          }
          checked.add(otherPixels[0]);
          checked.add(otherPixels[1]);
          newColors.add(new PixelData(pixel.y, pixel.x, colors[0]));
          newColors.add(new PixelData(otherPixels[1].y, otherPixels[1].x, colors[1]));
        } else {
          // both are real colors
          Color c1 = otherPixels[0].color;
          Color c0 = otherPixels[1].color;
          if (c0 == c1) {
            newColors.add(new PixelData(pixel.y, pixel.x, c0));
          } else {
            // if (![c0, c1].includes(Color.yellow)) {
            if (c0 != Color.yellow && c1 != Color.yellow) {
              // green and purple
              newColors.add(new PixelData(pixel.y, pixel.x, Color.yellow));
              // } else if (![c0, c1].includes(Color.green)) {
            } else if (c0 != Color.green && c1 != Color.green) {
              // yellow and purple
              newColors.add(new PixelData(pixel.y, pixel.x, Color.green));
            } else {
              // yellow and green
              newColors.add(new PixelData(pixel.y, pixel.x, Color.purple));
            }
          }
        }
      }
    }
    return newColors;
  }

  public int hash() {
    int hash = 1;

    for (ArrayList<Pixel> row : this.pixels) {
      for (Pixel pixel : row) {
        // Incorporate pixel.color.val into the hash
        hash = 31 * hash + pixel.color.val;
      }
    }

    return hash;
  }

  public int getLines() {
    int lines = 0;
    for (int i = 2; i < this.pixels.size(); i += 3) {
      if (this.pixels.get(i).stream().noneMatch(p -> p.color != Color.empty))
        break; // since its bottom up, we can early exit if we have an empty row
      lines++;
    }
    return lines;
  }

  public int getScore() {
    int score = 0;
      for (ArrayList<Pixel> row : this.pixels) {
          for (Pixel pixel : row) {
              if (pixel.color != Color.empty)
                  score += 3;
          }
      }
    ArrayList<Pixel[]> mosaics = this.findMosaics();
    score += mosaics.size() * 10;
    int lines = this.getLines();
    score += lines * 10;
    return score;
  }

  public Board copy() {
    Board copy = new Board();
    // copy.pixels = this.pixels.stream().map(row -> row.stream().map(p -> new
    // Pixel(copy, p.y, p.x,
    // p.color)).collect(Collectors.toList())).collect(Collectors.toList());
    copy.pixels = this.pixels.stream()
        .map(row -> row.stream()
            .map(p -> new Pixel(copy, p.y, p.x, p.color)).collect(Collectors.toCollection(ArrayList::new)))
        .collect(Collectors.toCollection(ArrayList::new));
    return copy;
  }

  public List<Pixel> getMoves() {
    List<Pixel> moves = new ArrayList<>();

    for (int i = this.pixels.size() - 1; i >= 0; i--) {
      for (int j = 0; j < this.pixels.get(i).size(); j++) {
        Pixel pixel = this.pixels.get(i).get(j);

        if (pixel.color != Color.empty) {
          continue; // skip if not empty
        }

        // check if pixels covering it
        Pixel tL = pixel.getNeighbor(Direction.topLeft);
        if (tL != null && tL.color != Color.empty) {
          continue;
        }

        Pixel tR = pixel.getNeighbor(Direction.topRight);
        if (tR != null && tR.color != Color.empty) {
          continue;
        }

        // check if the pixel has proper supports
        Pixel bL = pixel.getNeighbor(Direction.bottomLeft);
        Pixel bR = pixel.getNeighbor(Direction.bottomRight);

        if (bL != null && bL.color == Color.empty) {
          // missing left support
          continue;
        }

        if (bR != null && bR.color == Color.empty) {
          // missing right support
          continue;
        }

          moves.add(pixel);
      }
    }

    return moves;
  }
}

class Pixel extends PixelData {
  public int[][] offsets;
  public Board board;

  public Pixel(Board board, int y, int x) {
    this(board, y, x, Color.empty);
  }

  public Pixel(Board board, int y, int x, Color color) {
    super(y, x, color);
    this.board = board;
    if (y % 2 == 0) {
      this.offsets = new int[][] {
          { 1, 0 },
          { 1, 1 },
          { 0, 1 },
          { -1, 1 },
          { -1, 0 },
          { 0, -1 },
      };
    } else {
      this.offsets = new int[][] {
          { 1, -1 },
          { 1, 0 },
          { 0, 1 },
          { -1, 0 },
          { -1, -1 },
          { 0, -1 },
      };
    }
  }

  public Pixel getNeighbor(Direction direction) {
    int[] offset = this.offsets[direction.val];
    // System.out.println(offset);
    try {
      return this.board.pixels.get(this.y + offset[0]).get(this.x + offset[1]);
    } catch (IndexOutOfBoundsException e) {
      return null;
    }
  }

  public Pixel[] getNeighbors() {
    return getNeighbors(NeighborType.all);
  }

  public Pixel[] getNeighbors(NeighborType type) {
    if (type == NeighborType.none)
      return new Pixel[6];
    Pixel[] neighbors = new Pixel[offsets.length];
    for (int i = 0; i < offsets.length; i++) {
      int[] offset = offsets[i];
      int newX = this.x + offset[1];
      int newY = this.y + offset[0];

      if (newY < 0 || newY >= this.board.pixels.size() || newX < 0 || newX >= this.board.pixels.get(newY).size()) {
        continue;
      }
      Pixel pixel = this.board.pixels.get(newY).get(newX);
      if (pixel == null || pixel.color == Color.empty) {
        neighbors[i] = null;
        continue;
      }
      if (type == NeighborType.all) {
        neighbors[i] = pixel;
      } else if (type == NeighborType.colored || this.color == Color.colored) {
        neighbors[i] = pixel.color != Color.white ? pixel : null;
      } else if (type == NeighborType.same) {
        neighbors[i] = (pixel.color == this.color || pixel.color == Color.colored) ? pixel : null;
      } else if (type == NeighborType.different) {
        neighbors[i] = pixel.color != this.color ? pixel : null;
      } else if (type == NeighborType.differentColor) {
        neighbors[i] = (pixel.color != this.color && pixel.color != Color.white) ? pixel : null;
      }
    }
    return neighbors;
  }

  public int[] getTouchingColors() {
    Pixel[] colors = this.getNeighbors(NeighborType.all);
    int[] count = new int[Color.colored.val - Color.empty.val];
    for (int i = Color.empty.val; i < Color.colored.val; i++) {
      Color color = Color.fromInt(i);
      count[i] = Arrays.stream(colors).filter(e -> e != null && e.color == color).toArray(Pixel[]::new).length;
    }
    return count;
  }
}

enum Color {
  empty(0),
  white(1),
  yellow(2),
  green(3),
  purple(4),
  colored(5);

  Color(int val) {
    this.val = val;
  }

  public final int val;

  public static Color fromInt(int val) {
    for (Color c : Color.values()) {
      if (c.val == val) {
        return c;
      }
    }
    return null;
  }
}

enum Direction {
  topLeft(0),
  topRight(1),
  right(2),
  bottomRight(3),
  bottomLeft(4),
  left(5);

  Direction(int val) {
    this.val = val;
  }

  public final int val;

  public static Direction fromInt(int val) {
    for (Direction d : Direction.values()) {
      if (d.val == val) {
        return d;
      }
    }
    return null;
  }
}

class PixelData {
  public int x;
  public int y;
  public Color color;

  public PixelData(int y, int x, Color color) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  public PixelData(int y, int x) {
    this(y, x, Color.empty);
  }

  @Override
  public String toString() {
    return "(" + this.y + ", " + this.x + ", " + this.color + ")";
  }
}

enum NeighborType {
  none,
  all,
  same,
  different,
  differentColor,
  colored,
}

class ColorEscape {
  public static final String empty = "\u001B[0m";
  public static final String white = "\u001B[38;2;255;255;255m";
  public static final String yellow = "\u001B[38;2;255;196;96m";
  public static final String purple = "\u001B[38;2;255;96;196m";
  public static final String green = "\u001B[38;2;96;255;96m";
  public static final String colored = "\u001B[38;2;0;255;255m";
  public static final String reset = "\u001B[0m";

  public static String getColor(Color color) {
    return switch (color) {
      case empty -> ColorEscape.empty;
      case white -> ColorEscape.white;
      case yellow -> ColorEscape.yellow;
      case purple -> ColorEscape.purple;
      case green -> ColorEscape.green;
      case colored -> ColorEscape.colored;
    };
  }
}

class Branch {
  int score;
  ArrayList<PixelData> history;

  public Branch(int score, ArrayList<PixelData> history) {
    this.score = score;
    this.history = history;
  }
}

class getHighestScore {
  public static Branch calc(Board board, int depth, ArrayList<PixelData> history,
      Map<Integer, Branch> transpositionTable) {
    Integer boardKey = board.hash();

    if (transpositionTable.containsKey(boardKey)) {
      // System.out.println(boardKey);
      return transpositionTable.get(boardKey);
    }

    if (depth == 0) {
      return new Branch(board.getScore(), history);
    }
    ArrayList<PixelData> moves = board.getMoves().stream().map(e -> new PixelData(e.y, e.x))
        .collect(Collectors.toCollection(ArrayList<PixelData>::new));
    Branch maxScore = new Branch(Integer.MIN_VALUE, null);
    for (PixelData move : moves) {
      for (Color color : new Color[] { Color.white, Color.colored }) {
        board.pixels.get(move.y).get(move.x).color = color;
        ArrayList<PixelData> historyClone = new ArrayList<>(history);
        historyClone.add(new PixelData(move.y, move.x, color));
        Branch score = calc(board, depth - 1, historyClone, transpositionTable);
        board.pixels.get(move.y).get(move.x).color = Color.empty;
        // System.out.println(score.score + ": " + score.history.toString());
        if (score.score > maxScore.score) {
          maxScore = score;
        }
      }
    }
    transpositionTable.put(boardKey, maxScore);
    return maxScore;
  }
}
