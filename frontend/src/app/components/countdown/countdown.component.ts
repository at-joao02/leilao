import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';

@Component({
  selector: 'app-countdown',
  template: `
    @if (expired()) {
      <span class="text-red-400 font-semibold text-sm">Encerrado</span>
    } @else {
      <div class="flex gap-2 items-center">
        @for (unit of units(); track unit.label) {
          <div class="text-center">
            <div class="bg-white/10 rounded-lg px-2 py-1 min-w-[2.5rem] tabular-nums">
              <span class="text-lg font-bold leading-none text-white">{{ unit.value }}</span>
            </div>
            <span class="text-[10px] text-zinc-400 mt-0.5 block">{{ unit.label }}</span>
          </div>
          @if (!$last) {
            <span class="text-zinc-500 font-bold mb-3">:</span>
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
