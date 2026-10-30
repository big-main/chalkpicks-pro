export default function health(_req: any, res: any) {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    timestamp: new Date().toISOString(),
  });
}
