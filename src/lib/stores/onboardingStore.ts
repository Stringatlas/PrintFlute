import { derived } from 'svelte/store';
import { localStorageStore } from '$lib/utils/localStorageStore';

const CURRENT_ONBOARDING_VERSION = 1;

export interface OnboardingState {
	completedVersion: number;
	completedAt: string | null;
}

const initialState: OnboardingState = {
	completedVersion: 0,
	completedAt: null
};

export const onboardingStore = localStorageStore<OnboardingState>(
	'flute-generator-onboarding',
	initialState
);

export const shouldShowWelcome = derived(
	onboardingStore,
	($state) => $state.completedVersion < CURRENT_ONBOARDING_VERSION
);

export function completeOnboarding(): void {
	onboardingStore.set({
		completedVersion: CURRENT_ONBOARDING_VERSION,
		completedAt: new Date().toISOString()
	});
}

export function resetOnboarding(): void {
	onboardingStore.set(initialState);
}
