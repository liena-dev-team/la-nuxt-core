<template>
	<div class="la-form-message" v-if="show_messages && messages && messages.length > 0">
		<!-- Success -->
		<v-alert v-for="(msg, key) in success_msgs" :key="key" class="messages success" density="compact"
			color="success" icon="mdi-check-circle">
			<div class="item d-flex align-center">
				<span class="msg">{{ msg.msg }}</span>
			</div>
		</v-alert>
		<!-- Errors -->
		<v-alert class="messages error" v-for="(msgs, key) in field_errors" :key="key" density="compact" color="error"
			icon="mdi-alert-circle">
			<div class="item">
				<span class="field-error" v-if="fields[key]">
					<span class="property">{{ fields[key]?.caption }}:</span>
					<ol class="msgs">
						<li v-for="msg in msgs">- {{ msg }}</li>
					</ol>
				</span>
				<span class="non-field-error" v-else>
					<ol class="msgs">
						<li v-for="msg in msgs">{{ msg }}</li>
					</ol>
				</span>
			</div>
		</v-alert>
		<ol class="messages info" v-for="(msg, key) in info_msgs" :key="key">
			<li class="item">
				<span class="icon"><i class="fa-solid fa-circle-info"></i></span>
				<span class="msg">{{ msg.msg }}</span>
			</li>
		</ol>
		<ol class="messages warning" v-for="(msg, key) in warning_msgs" :key="key">
			<li class="item">
				<span class="icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
				<span class="msg">{{ msg.msg }}</span>
			</li>
		</ol>
	</div>
</template>

<script setup>

// Props
const { messages, fields, auto_hide, hide_timeout } = defineProps({
	messages: {
		type: Array,
		default: []
	},
	fields: {
		type: Object,
		default: {}
	},
	auto_hide: {
		type: Boolean,
		default: false
	},
	hide_timeout: {
		type: Number,
		default: 40000
	}
})

// Ref
const show_messages = ref(false);
const success_msgs = ref([]);
const info_msgs = ref([]);
const warning_msgs = ref([]);

// Model
const field_errors = defineModel('field_errors', { default: {} });

// Watch
watch(() => messages, function () {
	splitMessages();
})

function splitMessages() {
	show_messages.value = true;
	if (auto_hide) {
		setTimeout(() => {
			show_messages.value = false;
		}, hide_timeout);
	}

	success_msgs.value = messages.filter(msg => {
		return msg.type == FORM_MESSAGE_TYPE.SUCCESS;
	});

	info_msgs.value = messages.filter(msg => {
		return msg.type == FORM_MESSAGE_TYPE.INFO;
	});

	warning_msgs.value = messages.filter(msg => {
		return msg.type == FORM_MESSAGE_TYPE.WARNING;
	});

	groupErrorsIntoFields();
}

function groupErrorsIntoFields() {
	for (const key in field_errors.value) {
		delete field_errors.value[key];
	}

	messages.forEach(msg => {
		if (msg.type != FORM_MESSAGE_TYPE.ERROR) {
			return;
		}

		if (!field_errors.value[msg?.property]) {
			field_errors.value[msg?.property] = [];
		}

		field_errors.value[msg?.property].push(msg.msg);
	});

}

onMounted(() => {
	splitMessages();
})

</script>

<style lang="less">
.la-form-message {
	display: grid;
	gap: 4px;

	.messages {
		.item {
			display: flex;
			gap: 8px;
			border-radius: 4px;
			align-items: flex-start;

			.msg {
				text-align: left;
			}

			.field-error {
				display: grid;
				gap: 0px;
				justify-items: start;
			}

			.non-field-error {
				.msgs {
					list-style: disc;
					padding-left: 24px;
				}
			}
		}

		// Message Type Success
		&.success {}

		// Message Type Error
		&.error {}

		// Message Type Info
		&.info {}

		// Message Type Warning
		&.warning {}
	}

	.v-alert--density-compact {
		padding-bottom: 4px;
		padding-top: 4px;
	}
}
</style>
