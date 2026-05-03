<style>
	.row {
		display: grid;
		grid-template-columns: 100px 1fr 1fr auto;
		align-items: center;
		padding: 0 28px;
		height: 100%;
		gap: 16px;
	}

	/* Analog clock placeholder */
	.clock {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 1.5px dashed currentColor;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* House name + date */
	.identity {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* Digital time + am/pm label */
	.time {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0;
	}

	/* Placeholder text */
	.p-name {
		font-size: var(--text-md);
		font-weight: var(--font-weight-semibold);
		opacity: var(--opacity-text-secondary);
	}

	.p-date {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-normal);
		opacity: var(--opacity-text-muted);
		letter-spacing: 0.01em;
	}

	.p-hhmm {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-normal);
		line-height: 1;
		opacity: var(--opacity-text-secondary);
		letter-spacing: -0.02em;
	}

	.p-ampm {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-medium);
		opacity: var(--opacity-text-muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		align-self: flex-end;
	}

	.p-tiny {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: var(--opacity-text-muted);
	}
</style>

<div class="row">
	<!-- Analog clock -->
	<div class="clock">
		<span class="p-tiny">clock</span>
	</div>

	<!-- House name + date -->
	<div class="identity">
		<span class="p-name">Home Name</span>
		<span class="p-date">Day · Month DD</span>
	</div>

	<!-- Intentional whitespace (center zone) -->
	<div class="whitespace"></div>

	<!-- Digital time + AM/PM -->
	<div class="time">
		<span class="p-hhmm">0:00</span>
		<span class="p-ampm">AM</span>
	</div>
</div>
