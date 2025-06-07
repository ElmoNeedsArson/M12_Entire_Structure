export class CPUPerformance {
  prevTime = 0;
  prevCycles = 0;
  samples = new Float32Array(64);
  sampleIndex = 0;

  constructor(cpu, MHZ) {
    this.cpu = cpu;
    this.MHZ = MHZ;
  }

  reset() {
    this.prevTime = 0;
    this.prevCycles = 0;
    this.sampleIndex = 0;
  }

  update() {
    if (this.prevTime) {
      const delta = performance.now() - this.prevTime;
      const deltaCycles = this.cpu.cycles - this.prevCycles;
      const deltaCpuMillis = 1000 * (deltaCycles / this.MHZ);
      const factor = deltaCpuMillis / delta;
      if (!this.sampleIndex) {
        this.samples.fill(factor);
      }
      this.samples[this.sampleIndex++ % this.samples.length] = factor;
    }
    this.prevCycles = this.cpu.cycles;
    this.prevTime = performance.now();
    const avg = this.samples.reduce((x, y) => x + y) / this.samples.length;
    return avg;
  }
}
