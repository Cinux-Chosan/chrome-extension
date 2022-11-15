<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref } from 'vue';

const emits = defineEmits(['ok', 'cancel'])
const cookieStr = ref('')
const formData = reactive({
    cookieStr: ''
})

const ruleFormRef = ref<FormInstance>()
const rules = reactive<FormRules>({
    cookieStr: [
        { required: true, type: 'string', message: 'Not empty!' },
    ]
})

const submitForm = async () => {
    const formEl = ruleFormRef.value
    await formEl?.validate()
    emits('ok', formData.cookieStr)
}
</script>


<template>
    <el-form :model="formData" :rules="rules" ref="ruleFormRef" label-width="60px" size="small">
        <el-form-item label="Cookie" prop="cookieStr">
            <el-input type="textarea" v-model="formData.cookieStr" :rows="10" placeholder="请输入导出的 cookie"></el-input>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="submitForm()">确定</el-button>
            <el-button @click="emits('cancel')">取消</el-button>
        </el-form-item>
    </el-form>
</template>