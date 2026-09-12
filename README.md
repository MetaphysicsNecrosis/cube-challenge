# 🧊 立方体チャレンジ / Cube Challenge

## Cylinders and camera C (this fork)

Download `index.html` from this fork and open it in your browser. On the home
screen, choose **🥫 Цилиндры / Cylinders**. There is no timer or leaderboard.
One end ellipse is given: draw the complete far ellipse (including the hidden
part) and the two tangent sides. The cylinder's length equals its diameter;
the dashed axis ends at the marked centre of the second base. Switch between
**2 VP / 3 VP** in the drawing toolbar (starts a new task). VP1 and VP2 describe
the base plane; VP3 is the cylinder axis. In 2 VP, VP3 is at infinity and the
sides are parallel. VPs are shown from the start; arrows at the viewport edge
point towards off-screen VPs, not their actual locations. Zoom out to see them.
Judge reveals the complete answer and tangent extensions.
The original cube Study mode also retains the camera-point toggle.

The Play links below belong to the original author and do not run this fork.
For offline music and images, download the whole repository ZIP; the HTML
alone works without those optional assets.

Development check: `node tests/cylinders.cjs`.

## Two-cube construction trainer

Choose **🧊↕🧊 Два куба**. The perspective view contains only the completed,
face-coloured reference cube **A**. A separate panel in the lower-right corner
renders three gridded orthographic views (`TOP X/Z`, `FRONT X/Y`, `SIDE Z/Y`).
They define B's above/below placement, XYZ offset, size (`0.5×` to `2×`) and
rotation around the shared vertical axis without supplying a perspective face.
A rotated B has its own two horizontal vanishing points while both cubes share
the vertical VP; judging reveals both perspective systems.

When B would be mostly hidden, the task explicitly switches to **XRAY /
ПРОЕКЦИЯ** and asks for all 12 edges, including occluded ones. Other rounds ask
only for physically visible parts. The generator rejects tasks where B is too
small on screen or the construction leaves the drawable frame. This mode has
no timer or leaderboard.

Development check: `node tests/two-cubes.cjs`.

1つの面だけをヒントに、立方体の残りを予測して描くパース練習ゲームです。
A perspective-drawing game: you see one face of a cube — draw the rest!

## 🎮 あそぶ / Play

- **▶ ブラウザ・スマホで遊ぶ（このリポジトリの公開版）**
  **https://pigma005-dot.github.io/cube-challenge/**
  📱 スマホは「ホーム画面に追加」でアプリとして遊べます（オフライン対応）
- **▶ itch.io（メインページ・コメントはこちらへ）**
  **https://daromeon.itch.io/cube**

## ✨ とくちょう / Features

- 30秒×8ラウンドの自動採点（小数点2桁のガチ判定）＆称号システム
- 📅 デイリーチャレンジ（毎日みんな同じ10問）
- 🏆 オンラインランキング ／ ▶️ 描いた線のリプレイ再生
- 🖊️ ペンタブ・液タブ・マウス対応（筆圧で線の太さが変わります）
- 🌐 日本語 / English

---

made by [@daromeon](https://x.com/daromeon)
