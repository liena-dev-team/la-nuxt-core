<template>
	<div class="la-rating-star">
		<v-rating v-model="ratingValue" :length="max" :readonly="mode === 'view'" active-color="yellow"
			color="grey-lighten-1" density="compact" />
	</div>
</template>

<script setup>
const { mode, max, field } = defineProps({
	mode: {
		type: String,
		default: "view"
	},
	max: {
		type: Number,
		default: 5
	},
	field: {
		type: Object,
		default: () => ({})
	}
})

const modelValue = defineModel({
	type: [Number, String],
	default: 0
})

const ratingValue = computed({
	get() {
		const raw = modelValue.value
		if (raw != null && raw !== '') {
			const num = Number(raw)
			if (Number.isFinite(num)) return num
		}

		const fallback = Number(field?.value)
		return Number.isFinite(fallback) ? fallback : 0
	},
	set(val) {
		modelValue.value = val
		const el = document.activeElement
		if (el) el.blur()
	}
})
</script>

<style lang="less">
.la-rating-star {
	display: flex;
	align-items: center;
}
</style>
