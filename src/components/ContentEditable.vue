

<script lang="ts" setup>
import { nextTick, ref, toRefs } from 'vue';

const props = defineProps<{
    value: string
    emptyText?: string
}>()

const emits = defineEmits(['blur'])

const { value } = toRefs(props)

const localValue = ref('')

const inputRef = ref()

const isEdit = ref(false)

function onBlur(evt: FocusEvent, ...rest: any[]) {
    emits('blur', evt, ...rest)
    isEdit.value = false
}

async function onEdit() {
    localValue.value = value.value
    isEdit.value = true
    await nextTick()
    inputRef.value?.focus()
}

</script>

<template>
    <el-input v-if="isEdit" v-bind="$attrs" @blur="onBlur" v-model="localValue" ref="inputRef" />
    <div v-else @dblclick="onEdit" v-bind="$attrs">{{ value || emptyText }}</div>
</template>