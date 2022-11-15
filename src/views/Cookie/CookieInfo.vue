<script lang="ts" setup>
import { SameSiteStatus, type Cookie } from '@/utils/cookies';
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref } from 'vue';
import ipRegex from 'ip-regex';

const emits = defineEmits(['cancel', 'confirm'])

const props = defineProps<{
    value?: Cookie
}>()

const formData = reactive<Cookie>(Object.assign({
    domain: '',
    name: '',
    value: '',
    secure: false,
    httpOnly: false,
    expirationDate: undefined,
    sameSite: SameSiteStatus.lax,
    path: '/'
}, props.value))

const ruleFormRef = ref<FormInstance>()
const rules = reactive<FormRules>({
    domain: [
        { required: true, type: 'string', message: 'Please input Cookie domain' },
        { validator: checkDomain }
    ],
    name: [
        { required: true, type: 'string', message: 'Please input Cookie name' },
    ],
    value: [
        // { required: true, type: 'string', message: 'Please input Cookie value' },
    ],
})

function checkDomain(rule: any, value: string, callback: any) {
    callback()
    // value = value?.replace(/^\./, '')
    // if (value) {
    //     const regDomain = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/
    //     const isIp = ipRegex({ includeBoundaries: true, exact: true }).test(value)
    //     // TODO: 校验是否是合法的域名（含 localhost, local, test 等）、ipv4、ipv6
    //     if (value?.match(regDomain) || isIp) {
    //         callback()
    //     }
    // }
}

const submitForm = async () => {
    const formEl = ruleFormRef.value
    const result = await formEl?.validate()
    console.log('result', result);
    emits('confirm', formData)
}
</script>

<template>
    <el-form :model="formData" :rules="rules" ref="ruleFormRef" label-width="120px" size="small">
        <el-form-item label="域" prop="domain">
            <el-input v-model="formData.domain" :disabled="!!value?.domain" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="值" prop="value">
            <el-input v-model="formData.value" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
            <el-input v-model="formData.path" placeholder="默认为 /" />
        </el-form-item>
        <el-form-item label="过期时间" prop="expirationDate">
            <el-date-picker :model-value="formData.expirationDate! * 1000 || null"
                @update:modelValue="(val: number) => formData.expirationDate = val ? val / 1000 : undefined"
                placeholder="session" type="datetime" value-format="x" size="small" :teleported="false" />
        </el-form-item>
        <el-form-item label="Same Site" prop="sameSite">
            <el-select v-model="formData.sameSite">
                <el-option v-for="item in SameSiteStatus" :key="item" :label="item" :value="item" />
            </el-select>
        </el-form-item>
        <el-form-item label="Http Only" prop="httpOnly">
            <el-switch v-model="formData.httpOnly" inline-prompt active-text="Y" inactive-text="N" size="small" />
        </el-form-item>
        <el-form-item label="Secure" prop="secure">
            <el-switch v-model="formData.secure" inline-prompt active-text="Y" inactive-text="N" size="small" />
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="submitForm()">确定</el-button>
            <el-button @click="emits('cancel')">取消</el-button>
        </el-form-item>
    </el-form>

</template>