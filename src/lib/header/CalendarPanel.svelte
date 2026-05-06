<script lang="ts">
	import { calendarStore } from '../data/backendStores';
	import type { CalendarEvent } from '../data/types';

	interface DayGroup {
		label: string;
		dateStr: string;
		events: CalendarEvent[];
	}

	function formatEventTime(iso: string | undefined): string {
		if (!iso) return '';
		const d = new Date(iso);
		const h = d.getHours();
		const m = d.getMinutes();
		const ampm = h >= 12 ? 'pm' : 'am';
		const hour = h % 12 || 12;
		return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
	}

	function isAllDay(event: { start: string }): boolean {
		return !event.start.includes('T');
	}

	function localDateStr(d: Date): string {
		return [
			d.getFullYear(),
			String(d.getMonth() + 1).padStart(2, '0'),
			String(d.getDate()).padStart(2, '0')
		].join('-');
	}

	function ordinalSuffix(n: number): string {
		if (n >= 11 && n <= 13) return 'th';
		switch (n % 10) {
			case 1: return 'st';
			case 2: return 'nd';
			case 3: return 'rd';
			default: return 'th';
		}
	}

	function getDayHeader(dateStr: string): string {
		const today = new Date();
		const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
		const d = new Date(dateStr + 'T12:00:00');
		const diffDays = Math.round((d.getTime() - todayNoon.getTime()) / 86400000);
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays <= 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
		const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
		const day = d.getDate();
		return `${weekday} ${day}${ordinalSuffix(day)}`;
	}

	function getGroupedEvents(evts: CalendarEvent[]): DayGroup[] {
		const today = new Date();
		const todayStr = localDateStr(today);
		const map = new Map<string, CalendarEvent[]>();
		map.set(todayStr, []);
		for (const ev of evts) {
			const dateStr = ev.start.slice(0, 10);
			if (!map.has(dateStr)) map.set(dateStr, []);
			map.get(dateStr)!.push(ev);
		}
		return [...map.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateStr, events]) => ({ label: getDayHeader(dateStr), dateStr, events }));
	}

	$: groupedEvents = getGroupedEvents($calendarStore);
</script>

<style>
	.calendar {
		display: flex;
		flex-direction: column;
		padding: 14px 20px;
		overflow: hidden;
	}

	.agenda-scroll {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		touch-action: pan-y;
		cursor: grab;
		user-select: none;
	}

	.agenda-scroll::-webkit-scrollbar {
		display: none;
	}

	.agenda-day-header {
		font-size: var(--text-caption);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		padding-top: 8px;
	}

	.agenda-day-header:first-child {
		padding-top: 0;
	}

	.agenda-item {
		height: 32px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0 10px;
		gap: 8px;
		overflow: hidden;
	}

	.agenda-time {
		font-size: var(--text-caption);
		letter-spacing: 0.04em;
		opacity: var(--opacity-text-muted);
		flex-shrink: 0;
		width: 56px;
	}

	.agenda-title {
		font-size: var(--text-caption);
		opacity: var(--opacity-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>

<div class="calendar">
	<div
		class="agenda-scroll"
		on:pointerdown={(e) => {
			const el = e.currentTarget;
			const startY = e.clientY;
			const startTop = el.scrollTop;
			el.setPointerCapture(e.pointerId);
			const onMove = (ev: PointerEvent) => {
				el.scrollTop = startTop - (ev.clientY - startY);
			};
			const onUp = () => {
				el.removeEventListener('pointermove', onMove);
				el.removeEventListener('pointerup', onUp);
			};
			el.addEventListener('pointermove', onMove);
			el.addEventListener('pointerup', onUp);
		}}
	>
		{#each groupedEvents as group}
			<span class="agenda-day-header"
				>{group.events.length === 0 ? `${group.label} — No Events` : group.label}</span
			>
			{#if group.events.length > 0}
				{#each group.events as event}
					<div class="agenda-item">
						<span class="agenda-time">
							{#if isAllDay(event)}
								All day
							{:else}
								{formatEventTime(event.start)}
							{/if}
						</span>
						<span class="agenda-title">{event.summary}</span>
					</div>
				{/each}
			{/if}
		{/each}
	</div>
</div>
