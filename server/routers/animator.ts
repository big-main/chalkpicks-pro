
import { router, proProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { storagePut } from "../storage";
import { v4 as uuidv4 } from "uuid";

const execAsync = promisify(exec);

export const animatorRouter = router({
  /**
   * Generate a mathematical animation using Manim
   * Pro tier only
   */
  generateAnimation: proProcedure
    .input(
      z.object({
        type: z.enum(["riemann", "fourier", "surface"]),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = uuidv4();
      const workDir = path.join("/tmp", `manim_${id}`);
      const videoPath = path.join(workDir, "video.py");
      
      try {
        await fs.mkdir(workDir, { recursive: true });
        
        let manimCode = "";
        const sceneName = input.type === "riemann" ? "RiemannSums" : 
                         input.type === "fourier" ? "FourierSeriesSquareWave" : "ThreeDSurface";

        if (input.type === "riemann") {
          manimCode = `
from manim import *
class RiemannSums(Scene):
    def construct(self):
        title = Text("${input.title || "Riemann Sums"}", font_size=48).to_edge(UP)
        self.play(Write(title))
        axes = Axes(x_range=[0, 4, 1], y_range=[0, 3, 1], x_length=7, y_length=5).shift(DOWN * 0.5)
        graph = axes.get_graph(lambda x: np.sin(x) + 2, color=BLUE)
        rects = axes.get_riemann_rectangles(graph=graph, x_range=[0, 3], dx=3/5, color=YELLOW, stroke_width=0.1)
        self.play(Create(axes), Create(graph), FadeIn(rects))
        self.play(Transform(rects, axes.get_riemann_rectangles(graph=graph, x_range=[0, 3], dx=3/50, color=YELLOW, stroke_width=0.1)), run_time=3)
        self.wait()
`;
        } else if (input.type === "fourier") {
          manimCode = `
from manim import *
class FourierSeriesSquareWave(Scene):
    def construct(self):
        title = Text("${input.title || "Fourier Series"}", font_size=48).to_edge(UP)
        self.play(Write(title))
        center = LEFT * 3
        circles = VGroup()
        lines = VGroup()
        radii = [1.5, 0.5, 0.3]
        freqs = [1, 3, 5]
        current_center = center
        for i in range(len(radii)):
            circle = Circle(radius=radii[i], color=GRAY).move_to(current_center)
            line = Line(current_center, current_center + RIGHT * radii[i], color=BLUE)
            circles.add(circle)
            lines.add(line)
            current_center = line.get_end()
        self.add(circles, lines)
        self.wait(2)
`;
        } else {
          manimCode = `
from manim import *
class ThreeDSurface(ThreeDScene):
    def construct(self):
        self.set_camera_orientation(phi=75 * DEGREES, theta=30 * DEGREES)
        axes = ThreeDAxes()
        surface = Surface(lambda u, v: np.array([u, v, u**2 - v**2]), u_range=[-2, 2], v_range=[-2, 2], color=BLUE)
        self.add(axes)
        self.play(Create(surface))
        self.begin_ambient_camera_rotation(rate=0.1)
        self.wait(2)
`;
        }

        await fs.writeFile(videoPath, manimCode);

        // Render at low quality for speed
        const renderCmd = `manim -ql --media_dir ${workDir} ${videoPath} ${sceneName}`;
        await execAsync(renderCmd);

        // Find the generated mp4
        const outputDir = path.join(workDir, "videos", "video", "480p15");
        const files = await fs.readdir(outputDir);
        const mp4File = files.find(f => f.endsWith(".mp4"));
        
        if (!mp4File) throw new Error("Video file not generated");
        
        const videoBuffer = await fs.readFile(path.join(outputDir, mp4File));
        const { url } = await storagePut(`animations/${id}.mp4`, videoBuffer, "video/mp4");

        return { success: true, url };
      } catch (error: any) {
        console.error("Manim Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate animation: " + error.message,
        });
      } finally {
        await fs.rm(workDir, { recursive: true, force: true });
      }
    }),
});
