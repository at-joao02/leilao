import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';

@Component({
  selector: 'app-countdown',
  template: `
    @if (expired()) {
      <span class="text-rose-300 font-semibold text-sm">Encerrado</span>
    } @else {
      <div class="flex items-center gap-1">
        @for (unit of units(); track unit.label) {
          <div class="flex flex-col items-center">
            <div class="bg-[#001220] text-white font-mono text-[14px] font-bold px-1.5 py-0.5 rounded border border-[#0c82cd]/20 min-w-[2rem] text-center tabular-nums">
              {{ unit.value }}
            </div>
            <span class="text-[8px] text-slate-500 font-medium mt-0.5">{{ unit.label }}</span>
          </div>
          @if (!$last) {
            <span class="text-sky-400 font-mono text-sm font-bold -mt-3.5">:</span>
          }
        }
      </div>
    }
  `,
})
export class CountdownComponent implements OnInit, OnDestroy {
  @Input({ required: true }) auctionEnd!: string;

  private remaining = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  expired = computed(() => this.remaining() <= 0);

  units = computed(() => {
    const s = this.remaining();
    return [
      { label: 'dias',  value: String(Math.floor(s / 86400)).padStart(2, '0') },
      { label: 'horas', value: String(Math.floor((s % 86400) / 3600)).padStart(2, '0') },
      { label: 'min',   value: String(Math.floor((s % 3600) / 60)).padStart(2, '0') },
      { label: 'seg',   value: String(s % 60).padStart(2, '0') },
    ];
  });

  ngOnInit() {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private tick() {
    const diff = Math.floor((new Date(this.auctionEnd).getTime() - Date.now()) / 1000);
    this.remaining.set(Math.max(0, diff));
  }
}
