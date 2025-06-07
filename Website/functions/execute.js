import {   avrInstruction,
    AVRTimer,
    CPU,
    timer0Config,
    timer1Config,
    timer2Config,
    AVRIOPort,
    AVRUSART,
    portBConfig,
    portCConfig,
    portDConfig,
    usart0Config } from 'https://esm.sh/avr8js';
import { loadHex } from "./intelhex.js";
import { MicroTaskScheduler } from "./task-scheduler.js";

// ATmega328p params
const FLASH = 0x8000;

export class AVRRunner {
  program = new Uint16Array(FLASH);
  cpu;
  timer0;
  timer1;
  timer2;
  portB;
  portC;
  portD;
  usart;
  speed = 16e6; // 16 MHZ
  workUnitCycles = 500000;
  taskScheduler = new MicroTaskScheduler();

  constructor(hex) {
    loadHex(hex, new Uint8Array(this.program.buffer));
    this.cpu = new CPU(this.program);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.usart = new AVRUSART(this.cpu, usart0Config, this.speed);
    this.taskScheduler.start();
  }

  execute(callback) {
    const cyclesToRun = this.cpu.cycles + this.workUnitCycles;
    while (this.cpu.cycles < cyclesToRun) {
      avrInstruction(this.cpu);
      this.cpu.tick();
    }

    callback(this.cpu);
    this.taskScheduler.postTask(() => this.execute(callback));
  }

  stop() {
    this.taskScheduler.stop();
  }
}