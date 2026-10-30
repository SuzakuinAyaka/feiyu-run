// 一个完整步幅为 144 个世界单位；加速时自然加快步频。
export function runPose(distance, reduced = false) {
  const cycle = ((distance % 144) + 144) % 144 / 144;
  return {
    frame: Math.floor(cycle * 8),
    bob: reduced ? 0 : -2 * (1 - Math.cos(cycle * Math.PI * 4)) / 2,
    lean: reduced ? 0 : Math.sin(cycle * Math.PI * 2) * 0.015,
  };
}
