<script lang="ts" setup>
import { SameSiteStatus, type Cookie } from '@/utils/cookies';
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref } from 'vue';

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
    await formEl?.validate()
    // let { sameSite, secure } = formData
    // if (sameSite === SameSiteStatus.no_restriction && !secure) {
    //     await ElMessageBox.confirm(`当前 cookie 未开启 secure，设置为 no_restriction 将强制开启 secure，是否继续`)
    //     formData.secure = secure = true
    // }

    // if (!secure && sameSite === SameSiteStatus.no_restriction) {
    //     await ElMessageBox.confirm(`当前 cookie 的 Same Site 为 no_restriction 且未启用 secure，继续将会设置 Same Site 为默认值 Lax，是否继续`)
    //     formData.sameSite = sameSite = SameSiteStatus.lax
    // }
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