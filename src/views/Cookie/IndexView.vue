<script setup lang="ts">
import { computed, ref } from 'vue';
import cookieUse from './useCookie'
import { Search, Plus, ArrowDown } from '@element-plus/icons-vue'
import ContentEditable from '@/components/ContentEditable.vue';
import { serializeCookie, cookieToJsonStr, SameSiteStatus, type Cookie, removeCookie, setCookie, pruneCookie } from '@/utils/cookies'
import { ElMessage, ElMessageBox } from 'element-plus'
import tabInfo from '@/utils/tabs/useTab'
import MySubscribe from './MySubscribe.vue'
import CookieInfo from './CookieInfo.vue'
import ImportCookies from './ImportCookies.vue'
import { getUrlDomain } from '@/utils';
import { sortAndLift } from './utils';

const { isHttpTab, currentDomain } = tabInfo

const {
    isLoading,
    cookiesByDomain,
    bindToCurrent,
    applyToCurrent,
    updateField,
    delCookieItem,
    delAllCookie,
    importCookiesStr
} = cookieUse

// 页面过滤、搜索、展示等相关逻辑
const { searchText, filteredCookies, domains, copyCookie, copyByDomain } = (() => {
    const searchText = ref('')

    const filteredCookies = computed(() => {
        let result = {} as typeof cookiesByDomain.value
        // 如果是 http 开头则仅搜索域名，方便直接导出地址栏来进行搜索
        const searchTextValue = searchText.value?.startsWith('http') ? getUrlDomain(searchText.value) : searchText.value
        for (const key in cookiesByDomain.value) {
            if (!searchTextValue || key.includes(searchTextValue)) {
                result[key] = cookiesByDomain.value[key]
            }
        }

        return result
    })
    // 对域名进行排序
    const domains = computed(() => {
        const keys = Object.keys(filteredCookies.value)
        // 以域名维度排序
        keys.sort((a, b) => sortAndLift(a, b, currentDomain.value))
        return keys
    })

    // 拷贝 cookie 逻辑
    const copyCookie = async (key: string, index: number, type = "text") => {
        const cookie = filteredCookies.value[key][index]
        const str = type === 'text' ? serializeCookie(cookie) : cookieToJsonStr(cookie)
        await navigator.clipboard.writeText(str)
        ElMessage.success('导出成功！')
    }

    const copyByDomain = async (domain: string, type = "text") => {
        const cookies = filteredCookies.value[domain]
        const str = type === 'text' ?
            cookies.map(cookie => serializeCookie(cookie)).join('\n') :
            JSON.stringify(cookies.map((cookie) => pruneCookie(cookie)), null, 2)
        await navigator.clipboard.writeText(str)
        ElMessage.success('导出成功！')
    }

    return {
        searchText,
        filteredCookies,
        domains,
        copyCookie,
        copyByDomain
    }
})()



// 订阅相关抽屉
const { subscribeDrawer, toggleSubscribeDrawer } = (() => {
    const subscribeDrawer = ref(false)
    const toggleSubscribeDrawer = () => subscribeDrawer.value = !subscribeDrawer.value
    return {
        subscribeDrawer,
        toggleSubscribeDrawer
    }
})()

const activeName = ref('')

const cookieDialogVisible = ref(false)
const activeCookie = ref({} as Cookie)
const onEdit = (domain?: string, index?: number) => {
    activeCookie.value = typeof index === 'undefined' ? { domain } as Cookie : filteredCookies.value[domain!][index]
    cookieDialogVisible.value = true
}
const onEditConfirm = async (cookie: Cookie) => {
    const oldCookie = activeCookie.value
    if (oldCookie.name) {
        await removeCookie(oldCookie)
    }

    try {
        await setCookie(Object.assign({}, oldCookie, cookie))
        cookieDialogVisible.value = false
    } catch (error) {
        ElMessage.error(`写入失败：${(error as Error).message || error}`)
        // recover
        setCookie(oldCookie)
    }
}


const cookieImportVisible = ref(false)
const onOk = async (cookiesStr: string) => {
    try {
        await importCookiesStr(cookiesStr)
        cookieImportVisible.value = false
        ElMessage.success('导入成功！')
    } catch (error) {
        ElMessage.error('导入失败！')
    }
}

</script>


<template>
    <div class="cookie-nav">
        <el-link @click="onEdit()">新增</el-link>
        <el-link @click="cookieImportVisible = true">导入</el-link>
        <el-link @click="toggleSubscribeDrawer" v-if="isHttpTab">我的订阅</el-link>
    </div>

    <el-input v-model="searchText" placeholder="搜索" :prefix-icon="Search" />

    <el-skeleton :loading="isLoading" :rows="5" animated :style="{ marginTop: '15px' }">
        <template #default>
            <el-empty description="暂无数据" v-if="!domains?.length" />

            <el-collapse accordion v-model="activeName" v-else>
                <el-collapse-item v-for="domain in domains" :key="domain" :name="domain">
                    <template #title>
                        <div class="collapse-header-content">
                            <span class="domain">{{ domain }}</span> ({{ filteredCookies[domain].length }})
                            <el-button type="primary" size="small" class="cookie-item-header-btn"
                                @click.stop="applyToCurrent(domain)" v-if="isHttpTab">应用</el-button>
                            <el-button type="primary" size="small" class="cookie-item-header-btn"
                                @click.stop="bindToCurrent(domain)" v-if="isHttpTab">订阅</el-button>
                            <el-dropdown size="small" class="cookie-item-header-btn" :teleported="false">
                                <el-button type="primary" size="small" @click.stop="copyByDomain(domain, 'text')">
                                    导出<el-icon class="el-icon--right">
                                        <arrow-down />
                                    </el-icon>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item @click.stop="copyByDomain(domain, 'json')">
                                            导出
                                            JSON</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                            <el-button type="primary" size="small" class="cookie-item-header-btn"
                                @click.stop="delAllCookie(domain)">删除</el-button>
                        </div>
                    </template>

                    <Transition>
                        <el-card shadow="hover" v-if="activeName === domain">
                            <el-table :data="filteredCookies[domain]" stripe style="width: 100%">
                                <el-table-column prop="name" label="名称" fixed min-width="140" show-overflow-tooltip>
                                    <template #default="{ row, $index }">
                                        <ContentEditable :value="row.name" class="content-editable"
                                            @blur="evt => updateField(domain, $index, 'name', evt.target.value, row.name)">
                                        </ContentEditable>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="value" label="值" min-width="140" show-overflow-tooltip>
                                    <template #default="{ row, $index }">
                                        <ContentEditable :value="row.value" class="content-editable"
                                            @blur="evt => updateField(domain, $index, 'value', evt.target.value, row.value)">
                                        </ContentEditable>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="path" label="路径" show-overflow-tooltip>
                                    <template #default="{ row, $index }">
                                        <ContentEditable :value="row.path" class="content-editable"
                                            @blur="evt => updateField(domain, $index, 'path', evt.target.value, row.path)">
                                        </ContentEditable>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="expirationDate" label="过期时间" min-width="250">
                                    <template #default="{ row, $index }">
                                        <el-date-picker :model-value="row.expirationDate * 1000 || null"
                                            @update:modelValue="async (val: number) => {
                                                if (val && val <= Date.now()) {
                                                    await ElMessageBox.confirm(`选择时间小于等于当前时间， cookie 将被自动清除`)
                                                }
                                                updateField(domain, $index, 'expirationDate', val / 1000, row.expirationDate)
                                            }" placeholder="session" type="datetime" value-format="x" size="small" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="sameSite" label="Same Site" min-width="140"
                                    show-overflow-tooltip>
                                    <template #default="{ row, $index }">
                                        <el-select :model-value="row.sameSite" @change="async (val: SameSiteStatus) => {
                                            // if (val === SameSiteStatus.no_restriction && !row.secure) {
                                            //     await ElMessageBox.confirm(`当前 cookie 未开启 secure，设置为 no_restriction 将强制开启 secure，是否继续`)
                                            //     await updateField(domain, $index, 'secure', true, row.secure)
                                            // }
                                            updateField(domain, $index, 'sameSite', val, row.sameSite)
                                        }" size="small">
                                            <el-option v-for="item in SameSiteStatus" :key="item" :label="item"
                                                :value="item" />
                                        </el-select>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="httpOnly" label="Http Only" min-width="90">
                                    <template #default="{ row, $index }">
                                        <el-switch :model-value="row.httpOnly" inline-prompt active-text="Y"
                                            inactive-text="N"
                                            @change="(val: boolean) => updateField(domain, $index, 'httpOnly', val, row.httpOnly)"
                                            size="small" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="secure" label="Secure">
                                    <template #default="{ row, $index }">
                                        <el-switch :model-value="row.secure" inline-prompt active-text="Y"
                                            inactive-text="N" @change="async (val: boolean) => {
                                                // if (!val && row.sameSite === SameSiteStatus.no_restriction) {
                                                //     await ElMessageBox.confirm(`当前 cookie Same Site 为 no_restriction，关闭 secure 将会设置 Same Site 默认未 Lax，是否继续`)
                                                //     await updateField(domain, $index, 'sameSite', SameSiteStatus.lax, row.sameSite)
                                                // }
                                                updateField(domain, $index, 'secure', val, row.secure)
                                            }" size="small" />
                                    </template>
                                </el-table-column>
                                <el-table-column fixed="right" width="140">
                                    <template #header>
                                        <div class="flex-op">
                                            操作 <el-button type="primary" size="small" link @click="onEdit(domain)">
                                                <el-icon>
                                                    <Plus />
                                                </el-icon>
                                            </el-button>
                                        </div>
                                    </template>
                                    <template #default="{ $index }">
                                        <div class="table-op">
                                            <el-button link type="primary" size="small" @click="onEdit(domain, $index)">
                                                编辑
                                            </el-button>

                                            <el-dropdown size="small">
                                                <el-button link type="primary" size="small"
                                                    @click="copyCookie(domain, $index, 'text')">
                                                    导出<el-icon class="el-icon--right">
                                                        <arrow-down />
                                                    </el-icon>
                                                </el-button>
                                                <template #dropdown>
                                                    <el-dropdown-menu>
                                                        <el-dropdown-item @click="copyCookie(domain, $index, 'json')">
                                                            导出
                                                            JSON</el-dropdown-item>
                                                    </el-dropdown-menu>
                                                </template>
                                            </el-dropdown>

                                            <el-button link type="primary" size="small"
                                                @click="delCookieItem(domain, $index)">
                                                删除
                                            </el-button>
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-card>
                    </Transition>
                </el-collapse-item>
            </el-collapse>
        </template>
    </el-skeleton>
    <el-drawer v-model="subscribeDrawer" title="我的订阅" direction="rtl" size="80%">
        <MySubscribe />
    </el-drawer>

    <el-dialog v-model="cookieDialogVisible" title="创建/修改" top="8vh" destroy-on-close>
        <CookieInfo :value="activeCookie" @confirm="cookie => onEditConfirm(cookie)"
            @cancel="cookieDialogVisible = false" />
    </el-dialog>
    <el-dialog v-model="cookieImportVisible" title="导入 Cookie" top="8vh" destroy-on-close>
        <ImportCookies @ok="onOk" @cancel="cookieImportVisible = false" />
    </el-dialog>
</template>

<style lang="less" scoped>
.collapse-header-content {
    user-select: none;
    width: 100%;
    display: flex;
    align-items: center;

    .domain {
        user-select: auto;
    }

    .cookie-item-header-btn {
        margin-left: 12px;
        transition: all .3s;
        opacity: 0;
    }

    &:hover {
        .cookie-item-header-btn {
            opacity: 1;
        }
    }
}

.content-editable {
    min-height: 23px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cookie-nav {
    display: flex;
    justify-content: end;
    gap: 10px;
    margin: 10px 0;
}

.flex-op {
    display: flex;
    gap: 10px;
}

.table-op {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>