<script lang="ts">
	export let centsOff: number;
	export let noteName: string;
	export let octave: number;

	const MAX_CENTS = 50;

	function getTuningColor(cents: number): string {
		const absCents = Math.abs(cents);
		if (absCents < 5) return '#10b981';
		if (absCents < 10) return '#eab308';
		if (absCents < 20) return '#f97316';
		return '#ef4444';
	}

	$: needleOffset = (Math.max(-MAX_CENTS, Math.min(MAX_CENTS, centsOff)) / MAX_CENTS) * 50;
	$: color = getTuningColor(centsOff);
</script>

<div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
	<h3 class="text-sm font-medium text-gray-300 mb-4">Chromatic Tuner</h3>
	
	<div class="flex flex-col items-center space-y-4">
		<div class="text-4xl font-bold" style="color: {color}">
			{noteName}{octave}
		</div>

		<div class="w-full max-w-sm">
			<div class="relative h-20 bg-gray-900 rounded-lg overflow-hidden">
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="w-full h-12 relative">
						<div class="absolute left-1/4 top-0 bottom-0 w-px bg-gray-600"></div>
						<div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400"></div>
						<div class="absolute right-1/4 top-0 bottom-0 w-px bg-gray-600"></div>
						
						<div
							class="absolute top-1/2 h-16 w-1 -translate-y-1/2 transition-all duration-100"
							style="left: calc(50% + {needleOffset}%); background-color: {color}"
						>
							<div
								class="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent"
								style="border-bottom-color: {color}"
							></div>
						</div>
					</div>
				</div>

				<div class="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] text-gray-500">
					<span>-50¢</span>
					<span>-25¢</span>
					<span>0</span>
					<span>+25¢</span>
					<span>+50¢</span>
				</div>
			</div>
		</div>

		<div class="flex items-baseline space-x-2">
			<span class="text-3xl font-bold" style="color: {color}">
				{centsOff > 0 ? '+' : ''}{centsOff}¢
			</span>
		</div>
	</div>
</div>
